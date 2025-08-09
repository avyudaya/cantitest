import { AlbumCard } from '@/components/AlbumCard';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useMusic } from '../../components/MusicProvider';

export default function Home() {
    const { albums, loadAlbums, isLoading } = useMusic();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAlbums();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAlbums();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Albums</Text>
            <FlatList
                data={albums}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <AlbumCard album={item} />}
                numColumns={2}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 16,
    },
    listContainer: {
        padding: 8,
    },
});