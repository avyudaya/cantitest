import { StyleSheet, View } from 'react-native';
import { MusicPlayer } from '../../components/MusicPlayer';

export default function Player() {
  return (
    <View style={styles.container}>
      <MusicPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
});