import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Constants from "expo-constants";
import { MotiView } from "moti";
import React, { useState } from "react";

// Paper
import { TextInput, Button, Provider, Text } from "react-native-paper";
import DropDown from "react-native-paper-dropdown";

export default function usuarios() {
  const HOST_BACKEND_IOS = Constants.expoConfig?.extra?.HOST_BACKEND_IOS;
  const queryClient = useQueryClient();

  // Estados modal
  const [modalVisible, setModalVisible] = useState(false);

  // Form
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("USUARIO");

  // Dropdown
  const [showDropDown, setShowDropDown] = useState(false);

  const rolOpciones = [
    { label: "ADMIN", value: "ADMIN" },
    { label: "USUARIO", value: "USUARIO" },
    { label: "GUARDIA", value: "GUARDIA" },
  ];

  // Fetch usuarios
  const { data, isLoading, error } = useQuery({
    queryKey: ["usuarios"],
    queryFn: fetchUsuarios,
  });

  async function fetchUsuarios() {
    const res = await fetch(`${HOST_BACKEND_IOS}/obtener-usuarios`);
    if (!res.ok) throw new Error(`Error al obtener usuarios: ${res.statusText}`);

    const data = await res.json();
    return data.usuarios;
  }

  // Crear usuario
  const crearUsuario = async () => {
    try {
      const response = await fetch(`${HOST_BACKEND_IOS}/crear-usuario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellidos, email, rol }),
      });

      const data = await response.json();
      console.log(data);

      if (data.status === "success") {
        queryClient.invalidateQueries(["usuarios"]);
        setModalVisible(false);

        // limpiar inputs
        setNombre("");
        setApellidos("");
        setEmail("");
        setRol("USUARIO");
      }
    } catch (e) {
      console.log("Error:", e);
    }
  };

  return (
    <Provider>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingTop: Constants.statusBarHeight + 35,
        }}
      >
        {/* Agregar Usuario */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <IconSymbol name="plus" size={24} color="#fff" />
          <ThemedText style={styles.addButtonText}>Agregar Usuario</ThemedText>
        </TouchableOpacity>

        {isLoading && <ThemedText>Cargando usuarios...</ThemedText>}
        {error && <ThemedText>Error al cargar: {error.message}</ThemedText>}

        {/* Cards usuarios */}
        {data?.map((usuario, index) => (
          <MotiView
            key={usuario.id_usuario}
            style={styles.card}
            from={{ opacity: 0, translateY: 25 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 120, type: "timing" }}
          >
            <View style={styles.cardContent}>
              <ThemedText type="subtitle" style={styles.title}>
                {usuario.nombre} {usuario.apellidos}
              </ThemedText>

              <View style={styles.row}>
                <IconSymbol name="mail" size={18} color="#555" />
                <ThemedText style={styles.meta}>{usuario.email}</ThemedText>
              </View>

              <ThemedText style={styles.vehiculosTitle}>Vehículos</ThemedText>

              {usuario.vehiculos.length === 0 && (
                <ThemedText style={styles.noVehiculos}>
                  Sin vehículos registrados
                </ThemedText>
              )}

              {usuario.vehiculos.map((v) => (
                <View key={v.id_vehiculo} style={styles.vehiculoCard}>
                  <View style={styles.row}>
                    <IconSymbol name="car" size={18} color="#555" />
                    <ThemedText style={styles.meta}>Placa: {v.placa}</ThemedText>
                  </View>

                  <ThemedText style={styles.meta}>
                    {v.marca} {v.modelo} ({v.color})
                  </ThemedText>
                </View>
              ))}
            </View>
          </MotiView>
        ))}
      </ScrollView>

      {/* ----------------------------- */}
      {/* MODAL CREAR USUARIO           */}
      {/* ----------------------------- */}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Usuario</Text>

            <TextInput
              label="Nombre"
              value={nombre}
              onChangeText={setNombre}
              style={styles.input}
              textColor="#000"
            />

            <TextInput
              label="Apellidos"
              value={apellidos}
              onChangeText={setApellidos}
              style={styles.input}
              textColor="#000"
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
              textColor="#000"
            />

            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
              Rol del usuario
            </Text>

            <View style={styles.rolContainer}>
              {["ADMIN", "USUARIO", "GUARDIA"].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.rolButton,
                    rol === item && styles.rolButtonSelected,
                  ]}
                  onPress={() => setRol(item)}
                >
                  <Text
                    style={[
                      styles.rolButtonText,
                      rol === item && styles.rolButtonTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <Button mode="text" onPress={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={crearUsuario}>
                Guardar
              </Button>
            </View>

          </View>
        </View>
      </Modal>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef1f5", paddingHorizontal: 20 },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: "flex-start",
    gap: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingBottom: 10,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  cardContent: { padding: 16, gap: 8 },
  title: { fontWeight: "bold", fontSize: 18, marginBottom: 6, color: "#222" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 14, color: "#555" },

  vehiculosTitle: {
    marginTop: 10,
    fontWeight: "bold",
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 4,
  },

  vehiculoCard: {
    backgroundColor: "#f4f6f8",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },

  noVehiculos: {
    color: "#777",
    marginTop: 5,
    fontStyle: "italic",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  input: {
    backgroundColor: "#f1f1f1",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  rolContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  rolButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  rolButtonSelected: {
    borderColor: "#007bff",
    backgroundColor: "#007bff22",
  },

  rolButtonText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },

  rolButtonTextSelected: {
    color: "#007bff",
    fontWeight: "bold",
  },

});
