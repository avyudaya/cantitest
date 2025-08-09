import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMusic } from '../../components/MusicProvider';

interface Track {
    id: number;
    title: string;
    artist: string;
    url: string;
    duration: number;
}

export default function ActiveAlbum() {
  const {
    activeAlbum,
    currentTrack,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    isPlaying,
  } = useMusic();
  const router = useRouter();

  if (!activeAlbum) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>No album is currently active</Text>
      </View>
    );
  }

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
      <Text style={styles.header}>{activeAlbum.title}</Text>
      <View style={styles.topSection}>
        <Image source={{ uri: activeAlbum.coverImage }} style={styles.coverImage} cachePolicy='memory-disk'/>
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => previousTrack()} style={[styles.controlButton, isFirstTrack() && styles.disabledButton]}
  disabled={isFirstTrack()}>
            <Ionicons name="play-skip-back" size={32} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isPlaying ? pauseTrack : playTrack}
            style={[styles.controlButton, styles.playButton]}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
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

      {activeAlbum.description ? (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.description}>{activeAlbum.description}</Text>
        </View>
      ) : null}

      <Text style={styles.tracksTitle}>Tracks</Text>
      <FlatList
        data={activeAlbum.tracks}
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
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    marginTop: 30,
    marginBottom: 40,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  disabledButton: {
  opacity: 0.5,
},
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  coverImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 20,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    padding: 10,
  },
  activeTrackText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  playButton: {
    backgroundColor: '#007AFF',
    borderRadius: 40,
    padding: 16,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  activeTrackItem: {
        backgroundColor: '#e6f0ff',
    },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  tracksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tracksList: {
    // no flex: 1 here because inside ScrollView
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
