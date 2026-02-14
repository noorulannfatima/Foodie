import { View, Text, StyleSheet } from 'react-native';

export default function AuthIndex() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Welcome Authenticated User!</Text>
            <Text style={styles.subtext}>This is a placeholder screen for the (auth) group.</Text>
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
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtext: {
        fontSize: 14,
        color: '#666',
    },
});
