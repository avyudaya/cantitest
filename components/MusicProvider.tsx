import { prefetchTrack } from '@/utils/prefetchTrack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    Event,
    IOSCategory,
    IOSCategoryOptions,
    State,
    usePlaybackState,
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
    nextTrack: (restrictToAlbum?: boolean) => Promise<void>;
    previousTrack: (restrictToAlbum?: boolean) => Promise<void>;
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

    const playbackState = usePlaybackState();
    const progress = useProgress(1000);

    const isPlaying = playbackState === State.Playing;

    useEffect(() => {
        setupTrackPlayer();
    }, []);

    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
        if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
            const track = await TrackPlayer.getTrack(event.nextTrack);
            if (track) {
                setCurrentTrack(track as Track);
            }

            const currentIdx = await TrackPlayer.getCurrentTrack();
            const queue = await TrackPlayer.getQueue();

            setTrackIndex(currentIdx);
            setQueueLength(queue.length);

            // Update activeAlbum if track belongs to a different album
            const currentAlbumTracks = activeAlbum?.tracks || [];
            const currentTrackInAlbum = currentAlbumTracks.find(t => t.id == track?.id);
            console.log(currentTrackInAlbum)

            if (!currentTrackInAlbum) {
                const newActiveAlbum = albums.find(album =>
                    album.tracks.some(t => t.id == track?.id)
                );
                if (newActiveAlbum) {
                    setActiveAlbum(newActiveAlbum);
                }
            }
        }
    });

    const setupTrackPlayer = async () => {
        if (isSetup) return;
        try {
            await TrackPlayer.setupPlayer({
                iosCategory: IOSCategory.Playback,
                iosCategoryOptions: [IOSCategoryOptions.AllowAirPlay, IOSCategoryOptions.AllowBluetooth],
                maxCacheSize: 200 * 1024 * 1024,
                maxBuffer: 30000,
                minBuffer: 25000,
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
            });
            isSetup = true;
        } catch (error) {
            console.error('Error setting up track player:', error);
        }
    };

    async function loadAlbums(
        setAlbums: Dispatch<SetStateAction<Album[]>>,
        setAllTracks: Dispatch<SetStateAction<Track[]>>,
        setIsLoading: Dispatch<SetStateAction<boolean>>
    ): Promise<void> {
        setIsLoading(true);
        try {
            AsyncStorage.clear()
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
                url: 'https://samplesongs.netlify.app/Death%20Bed.mp3',
                artwork: 'https://samplesongs.netlify.app/album-arts/death-bed.jpg',
                duration: 240,  // Update with accurate duration if needed
            },
            {
                id: 2,
                title: 'Bad Liar',
                artist: 'Imagine Dragons',
                url: 'https://samplesongs.netlify.app/Bad%20Liar.mp3',
                artwork: 'https://samplesongs.netlify.app/album-arts/bad-liar.jpg',
                duration: 210,  // Update with accurate duration if needed
            },
            {
                id: 3,
                title: 'Faded',
                artist: 'Alan Walker',
                url: 'https://samplesongs.netlify.app/Faded.mp3',
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
                ];

                // Save albums to state and cache
                setAlbums(mockAlbums);
                await AsyncStorage.setItem(ALBUMS_CACHE_KEY, JSON.stringify(mockAlbums));

                // Flatten tracks
                const allTracks = mockAlbums.flatMap(album => album.tracks);
                setAllTracks(allTracks);

                const initialLimit = 2;
                const initialTracks = allTracks.slice(0, initialLimit);
                const remainingTracks = allTracks.slice(initialLimit);

                // Prefetch and prepare TrackPlayer
                const prefetchedInitial = await Promise.all(
                    initialTracks.map(async (track) => {
                        const localUri = await prefetchTrack(track);
                        return { ...track, url: localUri };
                    })
                );

                await TrackPlayer.reset();
                await TrackPlayer.add(
                    prefetchedInitial.map(track => ({
                        id: track.id.toString(),
                        title: track.title,
                        artist: track.artist,
                        url: track.url,
                    }))
                );

                // Prefetch remaining in background
                setTimeout(async () => {
                    const prefetchedRemaining = await Promise.all(
                        remainingTracks.map(async (track) => {
                            const localUri = await prefetchTrack(track);
                            return { ...track, url: localUri };
                        })
                    );

                    await TrackPlayer.add(
                        prefetchedRemaining.map(track => ({
                            id: track.id.toString(),
                            title: track.title,
                            artist: track.artist,
                            url: track.url,
                        }))
                    );

                    setAllTracks([...prefetchedInitial, ...prefetchedRemaining]);
                }, 0);

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
            setActiveAlbum(album);
            setCurrentTrack(allTracks[firstTrackIndex]);
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
                loadAlbums: () => loadAlbums(setAlbums, setAllTracks, setIsLoading),
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
