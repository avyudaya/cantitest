import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
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
        // isBuffering,
        // volume,
        // setVolume,
        // isRepeatEnabled,
        // toggleRepeat,
        // isShuffleEnabled,
        // toggleShuffle
    } = useMusic();

    const [isVolumeVisible, setIsVolumeVisible] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);

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

    const handleSeekStart = () => {
        setIsSeeking(true);
    };

    const handleSeekChange = (value: number) => {
        setSeekPosition(value);
    };

    const handleSeekComplete = async (value: number) => {
        setIsSeeking(false);
        try {
            await seekTo(value);
        } catch (error) {
            console.error('Seek error:', error);
            Alert.alert('Error', 'Failed to seek to position');
        }
    };

    const handleVolumeToggle = () => {
        setIsVolumeVisible(!isVolumeVisible);
    };

    // const handleVolumeChange = (value: number) => {
    //     setVolume(value);
    // };

    const currentPosition = isSeeking ? seekPosition : progress.position;
    const duration = progress.duration || 0;
    const progressPercentage = duration > 0 ? (currentPosition / duration) * 100 : 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Album Art */}
            <View style={styles.albumArtContainer}>
                <Image
                    source={{ uri: activeAlbum.coverImage }}
                    style={styles.albumArt}
                    resizeMode="cover"
                />
                {/* <View style={styles.albumArtOverlay}>
                    {isBuffering && (
                        <View style={styles.bufferingContainer}>
                            <Text style={styles.bufferingText}>Loading...</Text>
                        </View>
                    )}
                </View> */}
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
                <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>

                <View style={styles.progressBarContainer}>
                    <View style={styles.progressTrack}>
                        <View
                            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                        />
                    </View>
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

                <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* Main Controls */}
            {/* <View style={styles.mainControls}>
                <TouchableOpacity
                    onPress={toggleShuffle}
                    style={[styles.controlButton, styles.shuffleButton]}
                >
                    <Ionicons
                        name="shuffle"
                        size={24}
                        color={isShuffleEnabled ? "#007AFF" : "#999"}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={previousTrack}
                    style={styles.controlButton}
                >
                    <Ionicons name="play-skip-back" size={36} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={isPlaying ? pauseTrack : playTrack}
                    style={[styles.controlButton, styles.playButton]}
                    disabled={isBuffering}
                >
                    {isBuffering ? (
                        <Text style={styles.bufferingDot}>...</Text>
                    ) : (
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={44}
                            color="white"
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={nextTrack}
                    style={styles.controlButton}
                >
                    <Ionicons name="play-skip-forward" size={36} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleRepeat}
                    style={[styles.controlButton, styles.repeatButton]}
                >
                    <Ionicons
                        name={isRepeatEnabled ? "repeat" : "repeat-outline"}
                        size={24}
                        color={isRepeatEnabled ? "#007AFF" : "#999"}
                    />
                </TouchableOpacity>
            </View> */}

            {/* Secondary Controls */}
            {/* <View style={styles.secondaryControls}>
                <TouchableOpacity
                    onPress={() => Alert.alert('Coming Soon', 'Add to playlist feature')}
                    style={styles.secondaryButton}
                >
                    <Ionicons name="add" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleVolumeToggle}
                    style={styles.secondaryButton}
                >
                    <Ionicons
                        name={volume > 0.5 ? "volume-high" : volume > 0 ? "volume-low" : "volume-mute"}
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Alert.alert('Coming Soon', 'Share track feature')}
                    style={styles.secondaryButton}
                >
                    <Ionicons name="share" size={24} color="#666" />
                </TouchableOpacity>
            </View> */}

            {/* Volume Control */}
            {/* {isVolumeVisible && (
                <View style={styles.volumeContainer}>
                    <Ionicons name="volume-low" size={20} color="#666" />
                    <Slider
                        style={styles.volumeSlider}
                        minimumValue={0}
                        maximumValue={1}
                        value={volume}
                        onValueChange={handleVolumeChange}
                        minimumTrackTintColor="#007AFF"
                        maximumTrackTintColor="#E5E5E5"
                        thumbStyle={styles.volumeThumb}
                    />
                    <Ionicons name="volume-high" size={20} color="#666" />
                </View>
            )} */}
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