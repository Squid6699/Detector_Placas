import { useState } from "react";
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";

export default function Login() {
    const router = useRouter();
    const { HOST_BACKEND_IOS } = Constants.expoConfig?.extra;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Completa todos los campos");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${HOST_BACKEND_IOS}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.message);
                return;
            }

            // Guardar token
            await AsyncStorage.setItem("token", data.token);
            await AsyncStorage.setItem("user", JSON.stringify(data.user));

            // Ir a tabs principal
            router.replace("/(tabs)");

        } catch (error) {
            alert("Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.card}>

                    <Text style={styles.title}>Iniciar sesión</Text>

                    <TextInput
                        label="Correo electrónico"
                        mode="outlined"
                        value={email}
                        style={styles.input}
                        onChangeText={setEmail}
                    />

                    <TextInput
                        label="Contraseña"
                        mode="outlined"
                        value={password}
                        secureTextEntry
                        style={styles.input}
                        onChangeText={setPassword}
                    />

                    <Button
                        mode="contained"
                        loading={loading}
                        onPress={handleLogin}
                        style={styles.button}
                    >
                        Entrar
                    </Button>

                </View>
            </KeyboardAvoidingView>
        </>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#eef1f5",
        justifyContent: "center",
        padding: 20,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 25,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 6,
    },

    logo: {
        width: "60%",
        height: 120,
        alignSelf: "center",
        marginBottom: 10,
    },

    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
        color: "#1e293b"
    },

    input: {
        marginBottom: 15,
    },

    button: {
        marginTop: 10,
        paddingVertical: 6,
    },
});
