import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMusic } from '../../components/MusicProvider';

export default function ActiveAlbum() {
    const { activeAlbum, playTrack, pauseTrack, nextTrack, previousTrack, isPlaying } = useMusic();

    if (!activeAlbum) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.emptyText}>No album is currently active</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Image source={{ uri: activeAlbum.coverImage }} style={styles.coverImage} />
                <Text style={styles.albumTitle}>{activeAlbum.title}</Text>
                <Text style={styles.artistName}>{activeAlbum.artist}</Text>

                <View style={styles.controls}>
                    <TouchableOpacity onPress={nextTrack} style={styles.controlButton}>
                        <Ionicons name="play-skip-forward" size={32} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
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
    albumTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    artistName: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
    coverImage: {
        width: 250,
        height: 250,
        borderRadius: 12,
        marginTop: 20,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
    albumArt: {
        width: 250,
        height: 250,
        borderRadius: 12,
        alignSelf: 'center',
        marginBottom: 30,
    },
    trackInfo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    trackTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    artist: {
        fontSize: 18,
        color: '#666',
        marginBottom: 4,
    },
    album: {
        fontSize: 16,
        color: '#999',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    timeText: {
        fontSize: 14,
        color: '#666',
        width: 45,
        textAlign: 'center',
    },
    progressBar: {
        flex: 1,
        height: 40,
    },
    thumb: {
        width: 20,
        height: 20,
        backgroundColor: '#007AFF',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
    },
    controlButton: {
        padding: 15,
    },
    playButton: {
        backgroundColor: '#007AFF',
        borderRadius: 40,
        padding: 20,
    },
});