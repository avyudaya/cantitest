import { randomUUID } from 'expo-crypto';
import { AppState, Dimensions, Platform } from 'react-native';
import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

class PlaybackTracker {
    private static instance: PlaybackTracker | null = null;
    private currentSession: any = null;
    private db: SQLiteDatabase | null = null;
    private trackingInterval: any = null;

    private constructor() {
        console.log('[PlaybackTracker] Constructor initialized');
        this.initDB();
        AppState.addEventListener('change', this.handleAppStateChange.bind(this));
        this.retryPendingSessions();
    }

    static getInstance(): PlaybackTracker {
        if (!PlaybackTracker.instance) {
            console.log('[PlaybackTracker] Creating new instance');
            PlaybackTracker.instance = new PlaybackTracker();
        }
        return PlaybackTracker.instance;
    }

    async initDB() {
        console.log('[PlaybackTracker] Initializing database');
        this.db = await SQLite.openDatabase({ name: 'MusicPlayerDB.db', location: 'default' });

        await this.db.executeSql(`
            CREATE TABLE IF NOT EXISTS pendingSessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_id TEXT,
                total_play_time INTEGER,
                play_percentage REAL,
                session_start TEXT,
                session_end TEXT,
                device_type TEXT,
                device_info TEXT,
                seek_count INTEGER,
                pause_count INTEGER,
                timestamp TEXT,
                attempts INTEGER,
                idempotency_token TEXT
            );
        `);

        await this.db.executeSql(`
            CREATE TABLE IF NOT EXISTS currentSession (
                id TEXT PRIMARY KEY,
                session_data TEXT
            );
        `);

        console.log('[PlaybackTracker] DB initialization complete');
    }

    async startPlayback(trackId: any, trackDuration: any) {
        console.log(`[PlaybackTracker] Starting playback: trackId=${trackId}, duration=${trackDuration}`);
        if (this.currentSession) {
            console.log('[PlaybackTracker] Ending previous session');
            await this.endCurrentSession();
        }

        this.currentSession = {
            track_id: trackId,
            track_duration: trackDuration,
            session_start: new Date(),
            total_play_time: 0,
            seek_count: 0,
            pause_count: 0,
            last_position: 0,
            is_playing: true,
            device_type: this.getDeviceType(),
            device_info: JSON.stringify(this.getDeviceInfo()),
            idempotency_token: randomUUID()
        };

        await this.saveCurrentSession();
        this.startTracking();
    }

    updatePlaybackPosition(currentTime: any) {
        console.log(`[PlaybackTracker] updatePlaybackPosition: currentTime=${currentTime}`);
        if (!this.currentSession) {
            console.log('[PlaybackTracker] No active session to update');
            return;
        }

        this.currentSession.last_position = currentTime;
        this.currentSession.play_percentage = (currentTime / this.currentSession.track_duration) * 100;

        if (Math.floor(currentTime) % 10 === 0) {
            console.log('[PlaybackTracker] Saving session during playback position update');
            this.saveCurrentSession();
        }
    }

    handleSeek() {
        console.log('[PlaybackTracker] handleSeek called');
        if (this.currentSession) {
            this.currentSession.seek_count++;
        }
    }

    handlePause() {
        console.log('[PlaybackTracker] handlePause called');
        if (this.currentSession) {
            this.currentSession.pause_count++;
            this.currentSession.is_playing = false;
        }
    }

    handlePlay() {
        console.log('[PlaybackTracker] handlePlay called');
        if (this.currentSession) {
            this.currentSession.is_playing = true;
        }
    }

    async endCurrentSession() {
        console.log('[PlaybackTracker] endCurrentSession called');
        if (!this.currentSession) {
            console.log('[PlaybackTracker] No session to end');
            return;
        }

        this.currentSession.session_end = new Date();
        this.currentSession.is_playing = false;

        await this.reportSession(this.currentSession);
        this.currentSession = null;
        await this.clearCurrentSession();
        this.stopTracking();
    }

    async reportSession(session: any) {
        console.log('[PlaybackTracker] reportSession called with payload:', session);

        const payload = {
            track_id: session.track_id,
            total_play_time: Math.floor(session.total_play_time),
            play_percentage: session.play_percentage || 0,
            session_start: session.session_start.toISOString(),
            session_end: session.session_end.toISOString(),
            device_type: session.device_type,
            device_info: JSON.parse(session.device_info),
            seek_count: session.seek_count,
            pause_count: session.pause_count,
            idempotency_token: session.idempotency_token
        };

        try {
            const response = await fetch('https://your.api/endpoint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            console.log('[PlaybackTracker] Session successfully reported');
        } catch (error) {
            console.error('[PlaybackTracker] Failed to report session:', error);
            await this.storePendingSession(payload);
        }
    }

    async storePendingSession(session: any) {
        console.log('[PlaybackTracker] Storing pending session:', session);

        await this.db!.executeSql(
            `INSERT INTO pendingSessions 
            (track_id, total_play_time, play_percentage, session_start, session_end, device_type, device_info, seek_count, pause_count, timestamp, attempts, idempotency_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                session.track_id,
                session.total_play_time,
                session.play_percentage,
                session.session_start,
                session.session_end,
                session.device_type,
                JSON.stringify(session.device_info),
                session.seek_count,
                session.pause_count,
                new Date().toISOString(),
                0,
                session.idempotency_token
            ]
        );
    }

    async saveCurrentSession() {
        console.log('[PlaybackTracker] Saving current session');
        if (!this.currentSession) return;

        await this.db!.executeSql(
            `REPLACE INTO currentSession (id, session_data) VALUES (?, ?)`,
            ['current', JSON.stringify(this.currentSession)]
        );
    }

    async clearCurrentSession() {
        console.log('[PlaybackTracker] Clearing current session from DB');
        await this.db!.executeSql(`DELETE FROM currentSession WHERE id = ?`, ['current']);
    }

    async retryPendingSessions() {
        const [results] = await this.db!.executeSql(`SELECT * FROM pendingSessions`);
        console.log('[PlaybackTracker] Retrying pending sessions', results.rows.length);
        for (let i = 0; i < results.rows.length; i++) {
            const row = results.rows.item(i);
            const session = { ...row, device_info: JSON.parse(row.device_info) };

            console.log(`[PlaybackTracker] Retrying session id=${row.id}, attempt=${session.attempts}`);

            if (session.attempts >= 3) {
                console.log(`[PlaybackTracker] Deleting session id=${row.id} after 3 failed attempts`);
                await this.db!.executeSql(`DELETE FROM pendingSessions WHERE id = ?`, [row.id]);
                continue;
            }

            try {
                const response = await fetch('https://your.api/endpoint', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    },
                    body: JSON.stringify(session)
                });

                if (response.ok) {
                    console.log(`[PlaybackTracker] Pending session id=${row.id} reported successfully`);
                    await this.db!.executeSql(`DELETE FROM pendingSessions WHERE id = ?`, [row.id]);
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.log(`[PlaybackTracker] Retry failed for session id=${row.id}:`, error);
                await this.db!.executeSql(
                    `UPDATE pendingSessions SET attempts = ? WHERE id = ?`,
                    [session.attempts + 1, row.id]
                );
            }
        }
    }

    handleAppStateChange(nextAppState: any) {
        console.log('[PlaybackTracker] App state changed:', nextAppState);
        if (nextAppState.match(/inactive|background/)) {
            this.handleAppClose();
        }
    }

    async handleAppClose() {
        console.log('[PlaybackTracker] App closing, handling current session');
        if (this.currentSession) {
            await this.endCurrentSession();
        }
    }

    startTracking() {
        console.log('[PlaybackTracker] Starting tracking interval');
        this.trackingInterval = setInterval(() => {
            if (this.currentSession && this.currentSession.is_playing) {
                this.currentSession.total_play_time += 1;
                this.saveCurrentSession();
                console.log('[PlaybackTracker] Incremented total_play_time to', this.currentSession.total_play_time);
            }
        }, 1000);
    }

    stopTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
            console.log('[PlaybackTracker] Stopped tracking interval');
        }
    }

    getDeviceType() {
        const os = Platform.OS;
        console.log('[PlaybackTracker] getDeviceType:', os);
        return os === 'ios' || os === 'android' ? 'mobile' : 'web';
    }


    getDeviceInfo() {
        const info = {
            platform: Platform.OS,
            version: Platform.Version,
            screen_resolution: `${Dimensions.get('window').width}x${Dimensions.get('window').height}`,
            language: 'en',
            model: '',
        };
        console.log('[PlaybackTracker] getDeviceInfo:', info);
        return info;
    }

    getAuthToken() {
        console.log('[PlaybackTracker] getAuthToken called');
        return 'your_token_here';
    }

    destroy() {
        console.log('[PlaybackTracker] Destroy called');
        this.stopTracking();
        if (this.currentSession) {
            this.handleAppClose();
        }
        console.log('[PlaybackTracker] Instance destroyed');
    }
}

export default PlaybackTracker;