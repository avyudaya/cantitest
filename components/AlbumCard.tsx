import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMusic } from './MusicProvider';

interface Album {
    id: string;
    title: string;
    artist: string;
    coverImage: string;
    description: string;
    tracks: any[];
}

interface AlbumCardProps {
    album: Album;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
    const { playAlbum, activeAlbum, isPlaying } = useMusic();
    const router = useRouter();

    const isCurrentAlbum = activeAlbum?.id === album.id;

    const handlePlayPress = () => {
        playAlbum(album);
    };

    const handleCardPress = () => {
        if (isCurrentAlbum && isPlaying) {
            router.push('/(tabs)/album');
        } else {
            router.push(`/album/${album.id}`);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleCardPress} style={styles.imageContainer}>
                <Image source={{ uri: album.coverImage }} style={styles.image} />
            </TouchableOpacity>

            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                    {album.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                    {album.artist}
                </Text>
            </View>

            <TouchableOpacity onPress={handlePlayPress} style={styles.playButton}>
                <Ionicons
                    name={isCurrentAlbum && isPlaying ? "pause" : "play"}
                    size={24}
                    color="white"
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 8,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 150,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    info: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    artist: {
        fontSize: 14,
        color: '#666',
    },
    playButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 122, 255, 0.8)',
        borderRadius: 20,
        padding: 8,
    },
});