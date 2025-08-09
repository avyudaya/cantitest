import { useMusic } from '@/components/MusicProvider';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthProvider';

export default function Profile() {
    const { user, signOut } = useAuth();
    const { resetPlayer } = useMusic();
    const router = useRouter();

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await resetPlayer();
                        await signOut();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.userInfo}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{user?.name || 'N/A'}</Text>

                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{user?.email || 'N/A'}</Text>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    userInfo: {
        marginBottom: 40,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#666',
    },
    signOutButton: {
        backgroundColor: '#ff3b30',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    signOutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});