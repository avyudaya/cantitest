import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (!context) {
        throw new Error('useMusic must be used within MusicProvider');
    }
    return context;
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [allTracks, setAllTracks] = useState<Track[]>([]);

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

                // Update activeAlbum if track belongs to a different album
                const currentAlbumTracks = activeAlbum?.tracks || [];
                const currentTrackInAlbum = currentAlbumTracks.find(t => t.id === track.id);

                if (!currentTrackInAlbum) {
                    const newActiveAlbum = albums.find(album =>
                        album.tracks.some(t => t.id === track.id)
                    );
                    if (newActiveAlbum) {
                        setActiveAlbum(newActiveAlbum);
                    }
                }
            }
        }
    });

    const setupTrackPlayer = async () => {
        try {
            await TrackPlayer.setupPlayer({
                iosCategory: IOSCategory.Playback,
                iosCategoryOptions: [IOSCategoryOptions.AllowAirPlay, IOSCategoryOptions.AllowBluetooth],
                maxCacheSize: 50 * 1024 * 1024,
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
        } catch (error) {
            console.error('Error setting up track player:', error);
        }
    };

    const loadAlbums = async () => {
        setIsLoading(true);
        try {
            // Mock data — replace with real API call
            const mockAlbums: Album[] = [
                {
                    id: 1,
                    title: 'Chill Lo-Fi Landscapes',
                    artist: 'Bryan Teoh',
                    coverImage: 'https://picsum.photos/id/1055/300/300',
                    description: 'Soft, mellow ambient sounds—great for study sessions and relaxation.',
                    tracks: [
                    {
                        id: 2,
                        title: 'Planeteer Reaction (LoFi Chill)',
                        artist: 'Bryan Teoh',
                        url: 'https://freepd.com/music/Planeteer%20Reaction.mp3',
                        duration: 248,
                    },
                    ],
                },
                {
                    id: 2,
                    title: 'Vintage Tape Echoes',
                    artist: 'Kevin MacLeod',
                    coverImage: 'https://picsum.photos/id/1062/300/300',
                    description: 'Lo-fi retro vibes: soft piano, ambient tape hiss and dusty nostalgia.',
                    tracks: [
                    {
                        id: 3,
                        title: 'Study and Relax',
                        artist: 'Kevin MacLeod',
                        url: 'https://freepd.com/music/Study%20and%20Relax.mp3',
                        duration: 223,
                    },
                    {
                        id: 4,
                        title: 'Mana Two – Part 1',
                        artist: 'Kevin MacLeod',
                        url: 'https://freepd.com/music/Mana%20Two%20-%20Part%201.mp3',
                        duration: 234,
                    },
                    ],
                },
                {
                    id: 3,
                    title: 'Dreamy Minimal Lo-Fi',
                    artist: 'Aetherwave',
                    coverImage: 'https://picsum.photos/id/1070/300/300',
                    description: 'Ambient synth textures with lo-fi ambiance—ideal for late-night focus.',
                    tracks: [
                    {
                        id: 5,
                        title: 'Glow in the Forest (Kosmose Vaikus)',
                        artist: 'Aetherwave',
                        url: 'https://freepd.com/music/Kosmose%20Vaikus.mp3',
                        duration: 362,
                    },
                    {
                        id: 6,
                        title: 'Breath of the Sea (Mere Hingamine)',
                        artist: 'Aetherwave',
                        url: 'https://freepd.com/music/Mere%20Hingamine.mp3',
                        duration: 185,
                    },
                    ],
                },
            ];

            setAlbums(mockAlbums);

            const tracks = mockAlbums.flatMap(album => album.tracks);
            setAllTracks(tracks);

            await TrackPlayer.reset();
            await TrackPlayer.add(tracks.map(track => ({
                id: track.id,
                url: track.url,
                title: track.title,
                artist: track.artist,
            })));

        } catch (error) {
            console.error('Error loading albums:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
                loadAlbums,
                playAlbum,
                playTrack,
                pauseTrack,
                nextTrack,
                previousTrack,
                seekTo,
                resetPlayer,
            }}
        >
            {children}
        </MusicContext.Provider>
    );
};
