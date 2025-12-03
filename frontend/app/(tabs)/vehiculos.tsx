import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Constants from "expo-constants";
import { MotiView } from "moti";
import React, { useState, useEffect } from "react";

// Paper
import { TextInput, Button, Provider, Text } from "react-native-paper";
import DropDown from "react-native-paper-dropdown";

export default function Vehiculos() {
  const HOST_BACKEND_IOS = Constants.expoConfig?.extra?.HOST_BACKEND_IOS;
  const queryClient = useQueryClient();

  // Estados modal
  const [modalVisible, setModalVisible] = useState(false);

  // Formulario Vehículo
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [idUsuario, setIdUsuario] = useState(null); // ID del usuario propietario

  // Dropdown Propietario
  const [showDropDown, setShowDropDown] = useState(false);
  const [propietarioOpciones, setPropietarioOpciones] = useState([]);

  // --- Funciones de Fetch ---

  // Fetch Vehículos
  const {
    data: vehiculos,
    isLoading: isLoadingVehiculos,
    error: errorVehiculos
  } = useQuery({
    queryKey: ["vehiculos"],
    queryFn: fetchVehiculos,
  });

  async function fetchVehiculos() {
    const res = await fetch(`${HOST_BACKEND_IOS}/obtener-vehiculos`);
    if (!res.ok) throw new Error(`Error al obtener vehículos: ${res.statusText}`);

    const data = await res.json();
    return data.vehiculos;
  }

  // Fetch Usuarios (Necesario para el dropdown de Propietario)
  const { data: usuarios, error: errorUsuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: fetchUsuarios,
  });

  async function fetchUsuarios() {
    const res = await fetch(`${HOST_BACKEND_IOS}/obtener-usuarios`);
    if (!res.ok) throw new Error(`Error al obtener usuarios: ${res.statusText}`);

    const data = await res.json();
    return data.usuarios;
  }

  // Rellenar las opciones del dropdown de propietarios
  useEffect(() => {
    if (usuarios) {
      // 1. Opción "Sin propietario"
      const opciones = [
        { label: "Sin propietario", value: null },
      ];

      // 2. Opciones de usuarios
      usuarios.forEach(user => {
        opciones.push({
          label: `${user.nombre} ${user.apellidos}`,
          value: user.id_usuario,
        });
      });

      setPropietarioOpciones(opciones);
      // Establecer el valor inicial a "Sin propietario" (null)
      setIdUsuario(null);
    }
  }, [usuarios]);

  // Crear Vehículo
  const crearVehiculo = async () => {
    try {
      const payload = {
        placa: placa,
        marca: marca,
        modelo: modelo,
        color: color,
        // Enviar null si no hay un propietario seleccionado
        id_usuario: idUsuario,
      };

      const response = await fetch(`${HOST_BACKEND_IOS}/crear-vehiculo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) { // Éxito (código 201)
        // Invalidar la consulta de vehículos para que se recarguen
        queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
        setModalVisible(false);

        // limpiar inputs
        setPlaca("");
        setMarca("");
        setModelo("");
        setColor("");
        setIdUsuario(null); // Restablecer a "Sin propietario"
      } else {
        // Manejar errores del servidor (e.g., placa obligatoria)
        alert(`Error: ${data.error || "No se pudo crear el vehículo"}`);
      }
    } catch (e) {
      console.log("Error:", e);
      alert("Error al intentar conectar con el servidor.");
    }
  };

  const selectedPropietarioLabel = propietarioOpciones.find(opt => opt.value === idUsuario)?.label || 'Sin propietario';

  return (
    <Provider>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingTop: Constants.statusBarHeight + 35,
        }}
      >
        {/* Agregar Vehículo */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <IconSymbol name="plus" size={24} color="#fff" />
          <ThemedText style={styles.addButtonText}>Agregar Vehículo</ThemedText>
        </TouchableOpacity>


        {isLoadingVehiculos && <ThemedText>Cargando vehículos...</ThemedText>}
        {errorVehiculos && <ThemedText>Error al cargar: {errorVehiculos.message}</ThemedText>}
        {errorUsuarios && <ThemedText>Advertencia: Error al cargar propietarios: {errorUsuarios.message}</ThemedText>}


        {/* Cards Vehículos */}
        {vehiculos?.map((vehiculo, index) => (
          <MotiView
            key={vehiculo.id_vehiculo}
            style={styles.card}
            from={{ opacity: 0, translateY: 25 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 120, type: "timing" }}
          >
            <View style={styles.cardContent}>
              <View style={styles.row}>
                <IconSymbol name="tag" size={20} color="#007bff" />
                <ThemedText type="subtitle" style={styles.title}>
                  {vehiculo.placa}
                </ThemedText>
              </View>

              <View style={styles.row}>
                <IconSymbol name="car" size={18} color="#555" />
                <ThemedText style={styles.meta}>
                  Marca/Modelo: {vehiculo.marca} {vehiculo.modelo}
                </ThemedText>
              </View>

              <View style={styles.row}>
                <IconSymbol name="palette" size={18} color="#555" />
                <ThemedText style={styles.meta}>Color: {vehiculo.color}</ThemedText>
              </View>

              <View style={styles.row}>
                <IconSymbol name="person" size={18} color="#555" />
                <ThemedText style={styles.meta}>
                  Propietario: {vehiculo.propietario_nombre}
                </ThemedText>
              </View>
            </View>
          </MotiView>
        ))}
      </ScrollView>

      {/* ----------------------------- */}
      {/* MODAL CREAR VEHÍCULO          */}
      {/* ----------------------------- */}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Vehículo</Text>



            <TextInput
              label="Placa (Obligatoria)"
              value={placa}
              onChangeText={(text) => setPlaca(text.toUpperCase())}
              style={styles.input}
              textColor="#000"
              autoCapitalize="characters"
            />

            <TextInput
              label="Marca"
              value={marca}
              onChangeText={setMarca}
              style={styles.input}
              textColor="#000"
            />

            <TextInput
              label="Modelo"
              value={modelo}
              onChangeText={setModelo}
              style={styles.input}
              textColor="#000"
            />

            <TextInput
              label="Color"
              value={color}
              onChangeText={setColor}
              style={styles.input}
              textColor="#000"
            />

            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, marginTop: 10 }}>
              Propietario
            </Text>

            {/* <DropDown
              label={"Propietario"}
              mode="outlined"
              visible={showDropDown}
              showDropDown={() => setShowDropDown(true)}
              onDismiss={() => setShowDropDown(false)}
              value={idUsuario}
              setValue={setIdUsuario}
              list={propietarioOpciones}
              dropDownItemStyle={{ color: "#000" }}
              inputProps={{ style: styles.dropdownInput }}
            /> */}

            <View style={styles.buttonRow}>
              <Button mode="text" onPress={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={crearVehiculo}
                disabled={!placa} // Desactivar si la placa está vacía
              >
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
  dropdownInput: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end", // Alineación a la derecha
    gap: 15,
    marginTop: 20,
  },
});