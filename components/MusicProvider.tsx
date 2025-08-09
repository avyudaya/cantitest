import React, { createContext, useContext, useEffect, useState } from 'react';
import TrackPlayer, {
    Capability,
    Event,
    State,
    usePlaybackState,
    useProgress,
    useTrackPlayerEvents
} from 'react-native-track-player';

interface Track {
    id: string;
    title: string;
    artist: string;
    url: string;
    duration: number;
}

interface Album {
    id: string;
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
    const progress = useProgress();

    const isPlaying = typeof playbackState === 'string' && playbackState === State.Playing;

    useEffect(() => {
        setupTrackPlayer();
    }, []);

    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
        if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
            const track = await TrackPlayer.getTrack(event.nextTrack);
            if (track) {
                setCurrentTrack(track as Track);

                // Check if we need to switch to next album
                const currentAlbumTracks = activeAlbum?.tracks || [];
                const currentTrackInAlbum = currentAlbumTracks.find(t => t.id === track.id);

                if (!currentTrackInAlbum) {
                    // Find which album this track belongs to
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
            await TrackPlayer.setupPlayer();
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
            });
        } catch (error) {
            console.error('Error setting up track player:', error);
        }
    };

    const loadAlbums = async () => {
        setIsLoading(true);
        try {
            // Mock API call - replace with your actual API
            const mockAlbums: Album[] = [
                {
                    id: '1',
                    title: 'Summer Hits',
                    artist: 'Various Artists',
                    coverImage: 'https://picsum.photos/300/300?random=1',
                    description: 'The best summer hits of the year.',
                    tracks: [
                        {
                            id: '1-1',
                            title: 'Summer Breeze',
                            artist: 'Artist 1',
                            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                            duration: 180,
                        },
                        {
                            id: '1-2',
                            title: 'Beach Party',
                            artist: 'Artist 2',
                            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                            duration: 200,
                        },
                    ],
                },
                {
                    id: '2',
                    title: 'Chill Vibes',
                    artist: 'Various Artists',
                    coverImage: 'https://picsum.photos/300/300?random=2',
                    description: 'Relaxing music for peaceful moments.',
                    tracks: [
                        {
                            id: '2-1',
                            title: 'Peaceful Mind',
                            artist: 'Artist 3',
                            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                            duration: 220,
                        },
                        {
                            id: '2-2',
                            title: 'Calm Waters',
                            artist: 'Artist 4',
                            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
                            duration: 240,
                        },
                    ],
                },
            ];

            setAlbums(mockAlbums);

            // Create queue with all tracks from all albums
            const tracks = mockAlbums.flatMap(album => album.tracks);
            setAllTracks(tracks);

            // Add all tracks to player queue
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
            setActiveAlbum(album);

            // Find the first track of this album in the queue
            const firstTrackIndex = allTracks.findIndex(track =>
                album.tracks.some(albumTrack => albumTrack.id === track.id)
            );

            if (firstTrackIndex !== -1) {
                await TrackPlayer.skip(firstTrackIndex);
                await TrackPlayer.play();
                setCurrentTrack(allTracks[firstTrackIndex]);
            }
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
        } catch (error) {
            console.error('Error skipping to next track:', error);
        }
    };

    const previousTrack = async () => {
        try {
            await TrackPlayer.skipToPrevious();
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
            }}
        >
            {children}
        </MusicContext.Provider>
    );
};