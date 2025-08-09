import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthProvider';

export default function Login() {
    const { signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            router.replace('/(tabs)/home');
        } catch (error) {
            Alert.alert('Error', 'Failed to sign in with Google');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Music App</Text>
            <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
                <Text style={styles.buttonText}>Sign in with Google</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#4285f4',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});