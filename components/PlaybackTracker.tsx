import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import { Dimensions, Platform } from 'react-native';
import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

interface PlaybackSession {
    track_id: string;
    track_duration: number;
    session_start: Date;
    session_end?: Date;
    total_play_time: number;
    seek_count: number;
    pause_count: number;
    last_position: number;
    is_playing: boolean;
    play_percentage?: number;
    device_type: string;
    device_info: string;
    idempotency_token: string;
}

SQLite.enablePromise(true);

class PlaybackTracker {
    private static instance: PlaybackTracker | null = null;
    private currentSession: PlaybackSession | null = null;
    private db: SQLiteDatabase | null = null;
    private batchInterval: any | null = null;

    private constructor() {
        console.log('[PlaybackTracker] Constructor initialized');
        this.initDB();
        this.setupNetworkListener();
        this.startBatchReporting();
    }

    static getInstance(): PlaybackTracker {
        if (!PlaybackTracker.instance) {
            console.log('[PlaybackTracker] Creating new instance');
            PlaybackTracker.instance = new PlaybackTracker();
        }
        return PlaybackTracker.instance;
    }

    async initDB() {
        try {
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
            console.log('[PlaybackTracker] DB initialization complete');
        } catch (error) {
            console.error('[PlaybackTracker] Failed to initialize database:', error);
            throw error;
        }
    }

    startPlayback(trackId: string, trackDuration: number) {
        console.log(`[PlaybackTracker] Starting playback: trackId=${trackId}, duration=${trackDuration}`);
        if (!trackId || trackDuration <= 0) {
            console.error('[PlaybackTracker] Invalid trackId or trackDuration');
            return;
        }

        if (this.currentSession) {
            console.log('[PlaybackTracker] Ending previous session');
            return
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
    }

    updatePlaybackPosition(currentTime: number) {
        console.log(`[PlaybackTracker] updatePlaybackPosition: currentTime=${currentTime}`);
        if (!this.currentSession) {
            console.log('[PlaybackTracker] No active session to update');
            return;
        }

        // Validate track_duration
        if (this.currentSession.track_duration <= 0) {
            console.error('[PlaybackTracker] Invalid track_duration:', this.currentSession.track_duration);
            return;
        }

        // Calculate time difference
        const timeDiff = currentTime - this.currentSession.last_position;

        // Update total_play_time only if the difference is <= 1 second (normal playback)
        if (this.currentSession.is_playing && timeDiff > 0 && timeDiff <= 1.1) { // Allow slight variation (e.g., 1.1s) for timing inaccuracies
            this.currentSession.total_play_time += timeDiff;
            console.log(`[PlaybackTracker] Incremented total_play_time by ${timeDiff.toFixed(2)} to ${this.currentSession.total_play_time.toFixed(2)}s`);
        } else if (timeDiff > 1.1) {
            console.log('[PlaybackTracker] Detected seek, not incrementing total_play_time');
            this.currentSession.seek_count++;
        }

        // Update last_position, capped at track_duration
        this.currentSession.last_position = Math.min(currentTime, this.currentSession.track_duration);

        // Calculate play_percentage
        this.currentSession.play_percentage = (this.currentSession.total_play_time / this.currentSession.track_duration) * 100;

        // Cap play_percentage at 100%
        if (this.currentSession.play_percentage > 100) {
            this.currentSession.play_percentage = 100;
        }

        console.log(`[PlaybackTracker] Updated last_position=${this.currentSession.last_position.toFixed(2)}, play_percentage=${this.currentSession.play_percentage.toFixed(2)}%`);
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

        await this.storePendingSession(this.currentSession);
        this.currentSession = null;
        await this.reportBatchSessions();
    }

    async reportSession(session: PlaybackSession) {
        console.log('[PlaybackTracker] reportSession called with payload:', session);
        await this.storePendingSession(session);
    }

    async storePendingSession(session: PlaybackSession) {
        if (!this.db) {
            console.error('[PlaybackTracker] Database not initialized');
            return;
        }

        console.log('[PlaybackTracker] Storing pending session:', session);
        await this.db.executeSql(
            `INSERT INTO pendingSessions 
            (track_id, total_play_time, play_percentage, session_start, session_end, device_type, device_info, seek_count, pause_count, timestamp, attempts, idempotency_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                session.track_id,
                Math.floor(session.total_play_time),
                session.play_percentage ?? 0,
                session.session_start.toISOString(),
                session.session_end?.toISOString() ?? new Date().toISOString(),
                session.device_type,
                session.device_info,
                session.seek_count,
                session.pause_count,
                new Date().toISOString(),
                0,
                session.idempotency_token
            ]
        );
    }

    async reportBatchSessions() {
        if (!this.db) {
            console.error('[PlaybackTracker] Database not initialized');
            return;
        }

        const [results] = await this.db.executeSql(`SELECT * FROM pendingSessions WHERE attempts < 3 LIMIT 50`);
        if (results.rows.length === 0) {
            console.log('[PlaybackTracker] No pending sessions to report');
            return;
        }

        const sessions = [];
        for (let i = 0; i < results.rows.length; i++) {
            const row = results.rows.item(i);
            sessions.push({
                id: row.id,
                track_id: row.track_id,
                total_play_time: row.total_play_time,
                play_percentage: row.play_percentage,
                session_start: row.session_start,
                session_end: row.session_end,
                device_type: row.device_type,
                device_info: JSON.parse(row.device_info),
                seek_count: row.seek_count,
                pause_count: row.pause_count,
                idempotency_token: row.idempotency_token,
                attempts: row.attempts
            });
        }

        console.log(`[PlaybackTracker] Reporting batch of ${sessions.length} sessions`);

        try {
            const response = await fetch('https://your.api/batch-endpoint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(sessions)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            for (const session of sessions) {
                await this.db.executeSql(`DELETE FROM pendingSessions WHERE id = ?`, [session.id]);
            }
            console.log(`[PlaybackTracker] Batch of ${sessions.length} sessions reported successfully`);
        } catch (error) {
            console.error('[PlaybackTracker] Failed to report batch:', error);
            for (const session of sessions) {
                if (session.attempts + 1 >= 3) {
                    console.log(`[PlaybackTracker] Deleting session id=${session.id} after 3 failed attempts`);
                    await this.db.executeSql(`DELETE FROM pendingSessions WHERE id = ?`, [session.id]);
                } else {
                    await this.db.executeSql(
                        `UPDATE pendingSessions SET attempts = ? WHERE id = ?`,
                        [session.attempts + 1, session.id]
                    );
                }
            }
        }
    }

    startBatchReporting() {
        console.log('[PlaybackTracker] Starting batch reporting interval');
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
        }
        this.batchInterval = setInterval(() => {
            this.reportBatchSessions();
        }, 5 * 60 * 1000);
    }

    stopBatchReporting() {
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
            this.batchInterval = null;
            console.log('[PlaybackTracker] Stopped batch reporting interval');
        }
    }

    setupNetworkListener() {
        NetInfo.addEventListener(state => {
            console.log('[PlaybackTracker] Network status changed:', state.isConnected);
            if (state.isConnected) {
                this.reportBatchSessions();
            }
        });
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
            model: ''
        };
        console.log('[PlaybackTracker] getDeviceInfo:', info);
        return info;
    }

    getAuthToken() {
        console.log('[PlaybackTracker] getAuthToken called');
        return 'your_token_here';
    }

    async destroy() {
        console.log('[PlaybackTracker] Destroy called');
        this.stopBatchReporting();
        if (this.db) {
            await this.db.close();
            console.log('[PlaybackTracker] Database closed');
        }
        PlaybackTracker.instance = null;
        console.log('[PlaybackTracker] Instance destroyed');
    }
}

export default PlaybackTracker;