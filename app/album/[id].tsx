import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMusic } from '../../components/MusicProvider';

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

export default function AlbumDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { albums, playAlbum, activeAlbum, isPlaying } = useMusic();
    const [album, setAlbum] = useState<Album | null>(null);

    useEffect(() => {
        const foundAlbum = albums.find(a => a.id === id);
        setAlbum(foundAlbum || null);
    }, [id, albums]);

    if (!album) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const isCurrentAlbum = activeAlbum?.id === album.id;

    const handlePlayAlbum = () => {
        playAlbum(album);
        router.push('/(tabs)/player');
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderTrack = ({ item, index }: { item: Track; index: number }) => (
        <View style={styles.trackItem}>
            <View style={styles.trackNumber}>
                <Text style={styles.trackNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>{item.title}</Text>
                <Text style={styles.trackArtist}>{item.artist}</Text>
            </View>
            <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={{ uri: album.coverImage }} style={styles.albumCover} />
                <View style={styles.albumInfo}>
                    <Text style={styles.albumTitle}>{album.title}</Text>
                    <Text style={styles.albumArtist}>{album.artist}</Text>
                    <Text style={styles.trackCount}>{album.tracks.length} tracks</Text>

                    <TouchableOpacity onPress={handlePlayAlbum} style={styles.playButton}>
                        <Ionicons
                            name={isCurrentAlbum && isPlaying ? "pause" : "play"}
                            size={24}
                            color="white"
                        />
                        <Text style={styles.playButtonText}>
                            {isCurrentAlbum && isPlaying ? 'Pause' : 'Play'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.description}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{album.description}</Text>
            </View>

            <Text style={styles.tracksTitle}>Tracks</Text>
            <FlatList
                data={album.tracks}
                keyExtractor={(item) => item.id}
                renderItem={renderTrack}
                style={styles.tracksList}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    albumCover: {
        width: 120,
        height: 120,
        borderRadius: 8,
        marginRight: 16,
    },
    albumInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    albumTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    albumArtist: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    trackCount: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    playButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    description: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    tracksTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 20,
        paddingBottom: 10,
    },
    tracksList: {
        flex: 1,
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    trackNumber: {
        width: 30,
        alignItems: 'center',
    },
    trackNumberText: {
        fontSize: 16,
        color: '#666',
    },
    trackInfo: {
        flex: 1,
        marginLeft: 12,
    },
    trackTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    trackArtist: {
        fontSize: 14,
        color: '#666',
    },
    trackDuration: {
        fontSize: 14,
        color: '#999',
    },
});