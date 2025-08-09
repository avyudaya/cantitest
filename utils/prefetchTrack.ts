import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface Track {
    id: number;
    title: string;
    artist: string;
    url: string;
    duration: number;
}



const URL_CACHE_KEY_PREFIX = 'cachedTrackUrl_';

export const prefetchTrack = async (track: Track): Promise<string> => {
  const localPath = `${FileSystem.cacheDirectory}${track.id}.mp3`;
  const storedUrlKey = `${URL_CACHE_KEY_PREFIX}${track.id}`;

  const storedUrl = await AsyncStorage.getItem(storedUrlKey);

  // If URL changed, delete old cached file
  if (storedUrl && storedUrl !== track.url) {
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(localPath);
      console.log(`Deleted cached file for track ${track.id} due to URL change`);
    }
  }

  const fileInfo = await FileSystem.getInfoAsync(localPath);
  if (!fileInfo.exists) {
    try {
      const downloadRes = await FileSystem.downloadAsync(track.url, localPath);
      // Save the new URL for next time
      await AsyncStorage.setItem(storedUrlKey, track.url);
      return downloadRes.uri;
    } catch (error) {
      console.warn(`Prefetch failed for ${track.title}:`, error);
      return track.url;
    }
  }

  return localPath;
};

export const clearAllCachedTracks = async (): Promise<void> => {
  try {
    await FileSystem.deleteAsync('FileSystem.cacheDirectory', { idempotent: true });
    // Optionally recreate the cache directory if you rely on it being there
    await FileSystem.makeDirectoryAsync('FileSystem.cacheDirectory', { intermediates: true });
    console.log('Cleared all cached tracks');
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};