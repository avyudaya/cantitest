import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    Event,
    IOSCategory,
    IOSCategoryOptions,
    State,
    useProgress,
    useTrackPlayerEvents
} from 'react-native-track-player';
import PlaybackTracker from './PlaybackTracker';

interface Track {
    id: number;
    title: string;
    artist: string;
    url: string;
    duration: number;
}

interface Album {
    id: number;
    title: string;
    artist: string;
    coverImage: string;
    description: string;
    tracks: Track[];
}

interface MusicContextType {
    albums: Album[];
    activeAlbum: Album | null;
    currentTrack: Track | null;
    isPlaying: boolean;
    isLoading: boolean;
    progress: any;

    loadAlbums: () => Promise<void>;
    playAlbum: (album: Album) => Promise<void>;
    playTrack: () => Promise<void>;
    pauseTrack: () => Promise<void>;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
    seekTo: (position: number) => Promise<void>;
    resetPlayer: () => Promise<void>;
    trackIndex: number | null;
    queueLength: number;
}

const ALBUMS_CACHE_KEY = 'cachedAlbums';

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (!context) {
        throw new Error('useMusic must be used within MusicProvider');
    }
    return context;
};
let isSetup = false;

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [allTracks, setAllTracks] = useState<Track[]>([]);
    const [trackIndex, setTrackIndex] = useState<number | null>(null);
    const [queueLength, setQueueLength] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false)

    const progress = useProgress(500);
    const hasHandledFirstTrackChange = useRef(false);
    const tracker = useRef<PlaybackTracker>(PlaybackTracker.getInstance());

    useEffect(() => {
        setupTrackPlayer();
        return () => {
            tracker.current.destroy()
        }
    }, []);

    useTrackPlayerEvents([Event.PlaybackTrackChanged, Event.PlaybackState], async (event) => {
        if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
            if (!hasHandledFirstTrackChange.current) {
                hasHandledFirstTrackChange.current = true;
                return;
            }
            await tracker.current.endCurrentSession();
            // Get the next track from TrackPlayer
            const track = await TrackPlayer.getTrack(event.nextTrack);
            if (track) {
                if(track.duration){
                    tracker.current.startPlayback(track.id.toString(), track.duration);
                }
                // Check if the current track is different from the new track
                if (currentTrack?.id !== track.id) {
                    setCurrentTrack(track as Track);
                }

                const currentIdx = await TrackPlayer.getCurrentTrack();
                const queue = await TrackPlayer.getQueue();

                // Update the track index and queue length only if they change
                if (currentIdx !== trackIndex) {
                    setTrackIndex(currentIdx);
                }
                if (queue.length !== queueLength) {
                    setQueueLength(queue.length);
                }

                // Update activeAlbum if track belongs to a different album
                const currentAlbumTracks = activeAlbum?.tracks || [];
                const currentTrackInAlbum = currentAlbumTracks.find(t => t.id == track?.id);

                if (!currentTrackInAlbum) {
                    // Find the new active album only if it changes
                    const newActiveAlbum = albums.find(album =>
                        album.tracks.some(t => t.id == track?.id)
                    );
                    if (newActiveAlbum && newActiveAlbum.id !== activeAlbum?.id) {
                        setActiveAlbum(newActiveAlbum);
                    }
                }
            }
        } else if (event.type === Event.PlaybackState) {
            if (event.state === State.Playing) {
                setIsPlaying(true);
                tracker.current.handlePlay();
            } else if (event.state === State.Paused) {
                setIsPlaying(false);
                tracker.current.handlePause();
            }
        }
    });

    useEffect(() => {
        if (currentTrack && isPlaying) {
            tracker.current.updatePlaybackPosition(progress.position);
        }
    }, [progress.position, currentTrack, isPlaying]);

    const setupTrackPlayer = async () => {
        if (isSetup) return;
        try {
            await TrackPlayer.setupPlayer({
                iosCategory: IOSCategory.Playback,
                iosCategoryOptions: [
                    IOSCategoryOptions.AllowAirPlay,
                    IOSCategoryOptions.AllowBluetooth,
                ],
                maxCacheSize: 200 * 1024 * 1024,
                maxBuffer: 30000,
                minBuffer: 1000,
                playBuffer: 500,
                backBuffer: 5000,
            });
            await TrackPlayer.updateOptions({
                capabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.SkipToNext,
                    Capability.SkipToPrevious,
                    Capability.SeekTo
                ],
                compactCapabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.SkipToNext
                ],
                android: {
                    appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
                },
                progressUpdateEventInterval: 2,
                alwaysPauseOnInterruption: false,
            });
            isSetup = true;
        } catch (error) {
            console.error('Error setting up track player:', error);
        }
    };

    async function loadAlbums(): Promise<void> {
        setIsLoading(true);
        try {
            const netState = await NetInfo.fetch();
            if (netState.isConnected) {
                // Online: load mock data
                const mockAlbums = [
                    {
                        id: 1,
                        title: 'Chill Vibes Playlist',
                        artist: 'Various Artists',
                        coverImage: 'https://picsum.photos/id/1055/300/300',  // Replace with appropriate cover image if available
                        description: 'A mix of relaxing tunes to chill out and vibe to.',
                        tracks: [
                            {
                                id: 1,
                                title: 'Death Bed',
                                artist: 'Powfu',
                                url: 'https://cantileverstagingstorage.blob.core.windows.net/media/tracks/Another_Brick_In_The_Wall_Part_1.mp3?se=2025-08-11T18%3A06%3A48Z&sp=r&sv=2025-05-05&sr=b&sig=fzMSMGnN1haDHQ72/CdYqFdLoUxB2Nq1JEIWScz%2B%2BP4%3D',
                                artwork: 'https://samplesongs.netlify.app/album-arts/death-bed.jpg',
                                duration: 240,  // Update with accurate duration if needed
                            },
                            {
                                id: 2,
                                title: 'Bad Liar',
                                artist: 'Imagine Dragons',
                                url: 'https://cantileverstagingstorage.blob.core.windows.net/media/tracks/The_Happiest_Days_Of_Our_Lives.mp3?se=2025-08-11T18%3A06%3A48Z&sp=r&sv=2025-05-05&sr=b&sig=iatQx0Vuuj0KP59lRUhsxeKqyl6mpIttZhrJrDfHKFc%3D',
                                artwork: 'https://samplesongs.netlify.app/album-arts/bad-liar.jpg',
                                duration: 210,  // Update with accurate duration if needed
                            },
                            {
                                id: 3,
                                title: 'Faded',
                                artist: 'Alan Walker',
                                url: 'https://cantileverstagingstorage.blob.core.windows.net/media/tracks/01_Floating_Points_Vocoder__Club_Mix_.wav?se=2025-08-12T10%3A31%3A45Z&sp=r&sv=2025-05-05&sr=b&sig=TXzRVGzVyVOw5yi519RrivN0/XW0Dt44seNA8%2BtW9YA%3D',
                                artwork: 'https://samplesongs.netlify.app/album-arts/faded.jpg',
                                duration: 220,  // Update with accurate duration if needed
                            },
                        ],
                    },
                    {
                        id: 2,
                        title: 'Pop Hits Collection',
                        artist: 'Various Artists',
                        coverImage: 'https://picsum.photos/id/1062/300/300',  // Replace with appropriate cover image if available
                        description: 'A collection of popular tracks that everyone knows and loves.',
                        tracks: [
                            {
                                id: 5,
                                title: 'Hate Me',
                                artist: 'Ellie Goulding',
                                url: 'https://samplesongs.netlify.app/Hate%20Me.mp3',
                                artwork: 'https://samplesongs.netlify.app/album-arts/hate-me.jpg',
                                duration: 230,  // Update with accurate duration if needed
                            },
                            {
                                id: 6,
                                title: 'Solo',
                                artist: 'Clean Bandit',
                                url: 'https://samplesongs.netlify.app/Solo.mp3',
                                artwork: 'https://samplesongs.netlify.app/album-arts/solo.jpg',
                                duration: 240,  // Update with accurate duration if needed
                            },
                            {
                                id: 7,
                                title: 'Without Me',
                                artist: 'Halsey',
                                url: 'https://cantileverstagingstorage.blob.core.windows.net/media/tracks/01_-_Poison_Root.wav?se=2025-08-12T10%3A31%3A45Z&sp=r&sv=2025-05-05&sr=b&sig=%2BVMDOIeM6dVvP3nworyljRdjKH98wknHO6m7DjI6nJg%3D',
                                artwork: 'https://samplesongs.netlify.app/album-arts/without-me.jpg',
                                duration: 250,  // Update with accurate duration if needed
                            },
                        ],
                    },
                    {
                        id: 3,
                        title: 'Classical Moods',
                        artist: 'Various Composers',
                        coverImage: 'https://picsum.photos/id/1025/300/300',
                        description: 'Timeless public domain classical pieces.',
                        tracks: [
                            { id: 8, title: 'Beethoven – Moonlight Sonata 1st Movement', artist: 'Ludwig van Beethoven', url: 'https://cantileverstagingstorage.blob.core.windows.net/media/tracks/02_-_Proud.wav?se=2025-08-12T10%3A31%3A45Z&sp=r&sv=2025-05-05&sr=b&sig=oIC0HbeAGqVVglczXJQ93EW6cK24geEtvNx1b9yudhc%3D', duration: 360 },
                            { id: 9, title: 'Chopin – Nocturne Op.9 No.2', artist: 'Frédéric Chopin', url: 'https://cantileverstagingstorage.blob.core.windows.net/media/tracks/03_-_County.wav?se=2025-08-12T10%3A31%3A45Z&sp=r&sv=2025-05-05&sr=b&sig=//8nilMLRUPi5DvZRYd0z57A6aXxJUAB4/NymkIlYco%3D', duration: 320 },
                        ],
                    },
                    {
                        id: 4,
                        title: 'Epic & Dramatic',
                        artist: 'FreePD Collection',
                        coverImage: 'https://picsum.photos/id/237/300/300',
                        description: 'Powerful, cinematic public domain sounds.',
                        tracks: [
                            { id: 10, title: 'Epic Drama', artist: 'FreePD Artist', url: 'https://cantileverstagingstorage.blob.core.windows.net/media/tracks/04_-_Bobby.wav?se=2025-08-12T10%3A31%3A45Z&sp=r&sv=2025-05-05&sr=b&sig=bL3Eao5/G4M5gPmicnEfO2cgy0b0XENVzwzEO1TDf7Y%3D', duration: 180 },
                            { id: 11, title: 'Triumphant March', artist: 'FreePD Artist', url: 'https://cantileverstagingstorage.blob.core.windows.net/media/tracks/Eminem_-_Houdini_Official_Music_Video.mp3?se=2025-08-12T10%3A31%3A45Z&sp=r&sv=2025-05-05&sr=b&sig=94oJzpaiXy6X%2B7vVgBfIRQYElp5shWQ0rlGnqHAq8hc%3D', duration: 200 },
                        ],
                    }

                ];

                // Save albums to state and cache
                setAlbums(mockAlbums);
                await AsyncStorage.setItem(ALBUMS_CACHE_KEY, JSON.stringify(mockAlbums));

                // Flatten tracks
                const allTracks = mockAlbums.flatMap(album => album.tracks);
                setAllTracks(allTracks);
                await TrackPlayer.reset();
                await TrackPlayer.add(
                    allTracks.map(track => ({
                        id: track.id.toString(),
                        title: track.title,
                        artist: track.artist,
                        url: track.url,
                        duration: track.duration
                    }))
                );
                setIsLoading(false);

            } else {
                // Offline: load from AsyncStorage
                const cached = await AsyncStorage.getItem(ALBUMS_CACHE_KEY);
                if (cached) {
                    const parsed: Album[] = JSON.parse(cached);
                    setAlbums(parsed);
                    const allTracks: Track[] = parsed.flatMap(album => album.tracks);
                    setAllTracks(allTracks);
                } else {
                    setAlbums([]);
                }
            }

        } catch (error) {
            console.error('Error loading albums:', error);
            setAlbums([]);
        } finally {
            setIsLoading(false);
        }
    }

    const playAlbum = async (album: Album) => {
        try {
            const firstTrackIndex = allTracks.findIndex(track =>
                album.tracks.some(albumTrack => albumTrack.id === track.id)
            );
            await TrackPlayer.skip(firstTrackIndex);
            await TrackPlayer.play();
        } catch (error) {
            console.error('Error playing album:', error);
        }
    };

    const playTrack = async () => {
        try {
            await TrackPlayer.play();
        } catch (error) {
            console.error('Error playing track:', error);
        }
    };

    const pauseTrack = async () => {
        try {
            await TrackPlayer.pause();
            setIsPlaying(false)
        } catch (error) {
            console.error('Error pausing track:', error);
        }
    };

    const nextTrack = async () => {
        try {
            await TrackPlayer.skipToNext();
            await TrackPlayer.play();
        } catch (error) {
            console.error('Error skipping to next track:', error);
        }
    };

    const previousTrack = async () => {
        try {
            await TrackPlayer.skipToPrevious();
            await TrackPlayer.play();
        } catch (error) {
            console.error('Error skipping to previous track:', error);
        }
    };

    const seekTo = async (position: number) => {
        try {
            await TrackPlayer.seekTo(position);
        } catch (error) {
            console.error('Error seeking:', error);
        }
    };

    const resetPlayer = async () => {
        try {
            await tracker.current.endCurrentSession();
            await TrackPlayer.reset();
            setCurrentTrack(null);
            setActiveAlbum(null);
            setTrackIndex(null);
            setQueueLength(0);
            setIsPlaying(false);
        } catch (error) {
            console.error('Failed to reset player:', error);
        }
    };

    return (
        <MusicContext.Provider
            value={{
                albums,
                activeAlbum,
                currentTrack,
                isPlaying,
                isLoading,
                progress,
                loadAlbums,
                playAlbum,
                playTrack,
                pauseTrack,
                nextTrack,
                previousTrack,
                seekTo,
                resetPlayer,
                trackIndex,
                queueLength,
            }}
        >
            {children}
        </MusicContext.Provider>
    );
};
