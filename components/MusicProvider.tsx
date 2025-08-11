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

    const progress = useProgress(250);
    const hasHandledFirstTrackChange = useRef(false);

    useEffect(() => {
        setupTrackPlayer();
    }, []);

    useTrackPlayerEvents([Event.PlaybackTrackChanged, Event.PlaybackState], async (event) => {
        if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
            if (!hasHandledFirstTrackChange.current) {
                hasHandledFirstTrackChange.current = true;
                return;
            }
            // Get the next track from TrackPlayer
            const track = await TrackPlayer.getTrack(event.nextTrack);
            if (track) {
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
            } else if (event.state === State.Paused) {
                setIsPlaying(false);
            }
        }
    });

    const setupTrackPlayer = async () => {
        if (isSetup) return;
        try {
            await TrackPlayer.setupPlayer({
                iosCategory: IOSCategory.Playback,
                iosCategoryOptions: [
                    IOSCategoryOptions.AllowAirPlay,
                    IOSCategoryOptions.AllowBluetooth,
                ],
                maxCacheSize: 50 * 1024 * 1024,
                maxBuffer: 30000,
                minBuffer: 15000,
                playBuffer: 2500,
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
                                url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lord%20of%20the%20Rangs.mp3',
                                artwork: 'https://samplesongs.netlify.app/album-arts/death-bed.jpg',
                                duration: 240,  // Update with accurate duration if needed
                            },
                            {
                                id: 2,
                                title: 'Bad Liar',
                                artist: 'Imagine Dragons',
                                url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Grand%20Dark%20Waltz%20Allegro.mp3',
                                artwork: 'https://samplesongs.netlify.app/album-arts/bad-liar.jpg',
                                duration: 210,  // Update with accurate duration if needed
                            },
                            {
                                id: 3,
                                title: 'Faded',
                                artist: 'Alan Walker',
                                url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/SCP-x2x.mp3',
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
                                url: 'https://samplesongs.netlify.app/Without%20Me.mp3',
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
                            { id: 8, title: 'Beethoven – Moonlight Sonata 1st Movement', artist: 'Ludwig van Beethoven', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Feelin%20Good.mp3', duration: 360 },
                            { id: 9, title: 'Chopin – Nocturne Op.9 No.2', artist: 'Frédéric Chopin', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/AcidJazz.mp3', duration: 320 },
                        ],
                    },
                    {
                        id: 4,
                        title: 'Epic & Dramatic',
                        artist: 'FreePD Collection',
                        coverImage: 'https://picsum.photos/id/237/300/300',
                        description: 'Powerful, cinematic public domain sounds.',
                        tracks: [
                            { id: 10, title: 'Epic Drama', artist: 'FreePD Artist', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/AhDah.mp3', duration: 180 },
                            { id: 11, title: 'Triumphant March', artist: 'FreePD Artist', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Angels%20We%20Have%20Heard.mp3', duration: 200 },
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
            await TrackPlayer.reset();
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
