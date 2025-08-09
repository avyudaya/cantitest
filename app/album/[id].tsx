import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMusic } from '../../components/MusicProvider';

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

export default function AlbumDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const {
      albums,
      playAlbum,
      activeAlbum,
      currentTrack,
      playTrack,
      pauseTrack,
      nextTrack,
      previousTrack,
      isPlaying
    } = useMusic();

    const [album, setAlbum] = useState<Album | null>(null);

    useEffect(() => {
        const foundAlbum = albums.find(a => a.id === Number(id));
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

    const handlePlayPress = () => {
    if (isCurrentAlbum) {
            if (isPlaying) {
                pauseTrack();
            } else {
                playTrack();
            }
        } else {
            playAlbum(album);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isLastTrack = () => {
        if (!currentTrack || !activeAlbum) return false;
        const lastTrack = activeAlbum.tracks[activeAlbum.tracks.length - 1];
        return currentTrack.id == lastTrack.id;
    };

    const isFirstTrack = () => {
        if (!currentTrack || !activeAlbum) return false;
        const firstTrack = activeAlbum.tracks[0];
        return currentTrack.id == firstTrack.id;
    };

    const renderTrack = ({ item, index }: { item: Track; index: number }) => {
      const isCurrentTrack = currentTrack?.id == item.id;
    
      const content = (
        <View
          style={[
            styles.trackItem,
            isCurrentTrack ? styles.activeTrackItem : null,
          ]}
        >
          <View style={styles.trackNumber}>
            <Text style={[
              styles.trackNumberText,
              isCurrentTrack ? styles.activeTrackText : null,
            ]}>{index + 1}</Text>
          </View>
          <View style={styles.trackInfo}>
            <Text style={[
              styles.trackTitle,
              isCurrentTrack ? styles.activeTrackText : null,
            ]}>{item.title}</Text>
            <Text style={[
              styles.trackArtist,
              isCurrentTrack ? styles.activeTrackText : null,
            ]}>{item.artist}</Text>
          </View>
          <Text style={[
            styles.trackDuration,
            isCurrentTrack ? styles.activeTrackText : null,
          ]}>{formatDuration(item.duration)}</Text>
        </View>
      );
    
      if (isCurrentTrack) {
        return (
          <TouchableOpacity onPress={() => router.push('/(tabs)/player')}>
            {content}
          </TouchableOpacity>
        );
      }
    
      return content;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header + Playback controls */}
            <View style={styles.header}>
                <Image source={{ uri: album.coverImage }} style={styles.albumCover} cachePolicy='memory-disk'/>
                <View style={styles.albumInfo}>
                    <Text style={styles.albumTitle}>{album.title}</Text>
                    <Text style={styles.albumArtist}>{album.artist}</Text>
                    <Text style={styles.trackCount}>{album.tracks.length} tracks</Text>

                    {/* Playback Controls from ActiveAlbum */}
                    <View style={styles.controls}>
                        <TouchableOpacity onPress={() => previousTrack()} style={[styles.controlButton, isFirstTrack() && styles.disabledButton]}
                          disabled={isFirstTrack()}>
                            <Ionicons name="play-skip-back" size={32} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handlePlayPress}
                          style={[styles.controlButton, styles.playButton]}
                        >
                            <Ionicons
                              name={isPlaying && isCurrentAlbum ? 'pause' : 'play'}
                              size={32}
                              color="#fff"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => nextTrack()} style={[styles.controlButton, isLastTrack() && styles.disabledButton]}
                          disabled={isLastTrack()}>
                            <Ionicons name="play-skip-forward" size={32} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Description */}
            <View style={styles.description}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{album.description}</Text>
            </View>

            {/* Track list */}
            <Text style={styles.tracksTitle}>Tracks</Text>
            <FlatList
                data={album.tracks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderTrack}
                style={styles.tracksList}
                scrollEnabled={false}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    disabledButton: {
        opacity: 0.5,
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
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    controlButton: {
        padding: 10,
    },
    playButton: {
        backgroundColor: '#007AFF',
        borderRadius: 40,
        padding: 16,
    },
    description: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 20,
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
        marginBottom: 10,
    },
    tracksList: {
        // no flex: 1 since inside ScrollView
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activeTrackItem: {
        backgroundColor: '#e6f0ff',
    },
    trackNumber: {
        width: 30,
        alignItems: 'center',
    },
    trackNumberText: {
        fontSize: 16,
        color: '#666',
    },
    activeTrackText: {
        color: '#007AFF',
        fontWeight: '600',
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
