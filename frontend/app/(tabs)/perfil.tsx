import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Perfil() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.avatar}
        />

        <Text style={styles.title}>Mi perfil</Text>

        <TextInput
          label="Nombre"
          value={user.nombre.toUpperCase()}
          mode="outlined"
          style={styles.input}
          disabled
        />

        <TextInput
          label="Apellidos"
          value={user.apellidos.toUpperCase()}
          mode="outlined"
          style={styles.input}
          disabled
        />

        <TextInput
          label="Correo electrónico"
          value={user.email.toUpperCase()}
          mode="outlined"
          style={styles.input}
          disabled
        />

        <TextInput
          label="Rol"
          value={user.rol.toUpperCase()}
          mode="outlined"
          style={styles.input}
          disabled
        />

        <Button
          mode="contained"
          onPress={logout}
          style={styles.logoutButton}
        >
          Cerrar sesión
        </Button>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef1f5",
    padding: 20,
    justifyContent: "center",
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

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
  },

  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    marginBottom: 15,
  },

  logoutButton: {
    marginTop: 10,
    paddingVertical: 6,
  },
});
