import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useMusic } from './MusicProvider';

const { width } = Dimensions.get('window');

export const MusicPlayer: React.FC = () => {
    const {
        currentTrack,
        activeAlbum,
        isPlaying,
        progress,
        playTrack,
        pauseTrack,
        nextTrack,
        previousTrack,
        seekTo,
        trackIndex,
        queueLength
    } = useMusic();

    const isFirstTrack = trackIndex === 0;
    const isLastTrack = trackIndex === queueLength - 1;

    if (!currentTrack || !activeAlbum) {
        return (
            <View style={[styles.container, styles.emptyContainer]}>
                <Ionicons name="musical-notes" size={80} color="#ddd" />
                <Text style={styles.emptyText}>No music is currently playing</Text>
                <Text style={styles.emptySubText}>
                    Go to Home and select an album to start listening
                </Text>
            </View>
        );
    }

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeekComplete = async (value: number) => {
        try {
            await seekTo(value);
        } catch (error) {
            console.error('Seek error:', error);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Album Art */}
            <View style={styles.albumArtContainer}>
                <Image
                    source={{ uri: activeAlbum.coverImage }}
                    style={styles.albumArt}
                    resizeMode="cover"
                    cachePolicy='memory-disk'
                />
            </View>

            {/* Track Info */}
            <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={2}>
                    {currentTrack.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                    {currentTrack.artist}
                </Text>
                <Text style={styles.album} numberOfLines={1}>
                    {activeAlbum.title}
                </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(progress.position)}</Text>

                <View style={styles.progressBarContainer}>
                    <Slider
                        style={styles.progressSlider}
                        value={progress.position}
                        minimumValue={0}
                        maximumValue={progress.duration}
                        thumbTintColor="#FFD369"
                        minimumTrackTintColor="#FFD369"
                        maximumTrackTintColor="#fff"
                        onSlidingComplete={handleSeekComplete}
                    />
                </View>

                <Text style={styles.timeText}>{formatTime(progress.duration || 0)}</Text>
            </View>

            {/* Main Controls */}
            <View style={styles.mainControls}>
                

                <TouchableOpacity
                    onPress={() => !isFirstTrack && previousTrack()}
                    disabled={isFirstTrack}
                    style={[styles.controlButton, isFirstTrack && { opacity: 0.5 }]}
                >
                    <Ionicons name="play-skip-back" size={36} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={isPlaying ? pauseTrack : playTrack}
                    style={[styles.controlButton, styles.playButton]}
                >
                    <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={44}
                            color="white"
                        />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => !isLastTrack && nextTrack()}
                    disabled={isLastTrack}
                    style={[styles.controlButton, isLastTrack && { opacity: 0.4 }]}
                >
                    <Ionicons name="play-skip-forward" size={36} color="#333" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    albumArtContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
        position: 'relative',
    },
    albumArt: {
        width: width * 0.75,
        height: width * 0.75,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    albumArtOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    bufferingContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    bufferingText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    trackInfo: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    trackTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1a1a1a',
    },
    artist: {
        fontSize: 18,
        color: '#666',
        marginBottom: 4,
        textAlign: 'center',
    },
    album: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 4,
    },
    timeText: {
        fontSize: 14,
        color: '#666',
        width: 45,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    progressBarContainer: {
        flex: 1,
        position: 'relative',
        height: 20,
        justifyContent: 'center',
    },
    progressTrack: {
        height: 4,
        backgroundColor: '#E5E5E5',
        borderRadius: 2,
        marginHorizontal: 16,
    },
    progressFill: {
        height: 4,
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
    progressSlider: {
        position: 'absolute',
        width: '100%',
        height: 20,
    },
    progressThumb: {
        width: 16,
        height: 16,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    progressTrackStyle: {
        height: 4,
        borderRadius: 2,
    },
    mainControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    controlButton: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shuffleButton: {
        marginRight: 20,
    },
    repeatButton: {
        marginLeft: 20,
    },
    playButton: {
        backgroundColor: '#007AFF',
        borderRadius: 44,
        width: 88,
        height: 88,
        marginHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    bufferingDot: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    secondaryControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        marginBottom: 20,
    },
    secondaryButton: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    volumeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginTop: 10,
    },
    volumeSlider: {
        flex: 1,
        marginHorizontal: 16,
        height: 40,
    },
    volumeThumb: {
        width: 16,
        height: 16,
        backgroundColor: '#007AFF',
    },
});