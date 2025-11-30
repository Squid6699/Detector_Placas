import { View, StyleSheet, Image, Modal, Pressable, Animated, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { TextInput, Button, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useState, useRef, useEffect } from 'react';
import Constants from "expo-constants";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Incidencia() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const placas = JSON.parse(params.placas);
  const lat = Number(params.lat);
  const lng = Number(params.lng);
  const foto = String(params.foto);
  const { HOST_BACKEND_IOS } = Constants.expoConfig?.extra;

  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        const user = userString ? JSON.parse(userString) : null;
        if (user) {
          setIncidenciaValues(prev => ({
            ...prev,
            id_infractor: user.id_usuario,
            correo_infractor: user.email,
            nombre_infractor: user.nombre,
            apellidos_infractor: user.apellidos
          }));
        }
      } catch (error) {
        console.log("Error cargando usuario desde almacenamiento:", error);
        console.log("Error obteniendo usuario:", error);
      }
    };

    loadUser();
  }, []);



  const fechaOriginal = new Date(params.fecha);
  const fechaFormateada =
    `${fechaOriginal.getFullYear()}/` +
    `${String(fechaOriginal.getMonth() + 1).padStart(2, '0')}/` +
    `${String(fechaOriginal.getDate()).padStart(2, '0')} ` +
    `${String(fechaOriginal.getHours()).padStart(2, '0')}:` +
    `${String(fechaOriginal.getMinutes()).padStart(2, '0')}:` +
    `${String(fechaOriginal.getSeconds()).padStart(2, '0')}`;

  const [incidenciaValues, setIncidenciaValues] = useState<{
    placas: any;
    lat: number | null;
    lng: number | null;
    fecha: string;
    descripcion: string;
    id_infractor: string;
    correo_infractor: string;
    nombre_infractor: string;
    apellidos_infractor: string;
  }>({
    placas: placas[0] ?? "",
    lat,
    lng,
    fecha: fechaFormateada,
    descripcion: "",
    id_infractor: "",
    correo_infractor: "",
    nombre_infractor: "",
    apellidos_infractor: "",
  });

  const [evidencias, setEvidencias] = useState([]);
  const [showImage, setShowImage] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const addEvidencia = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setEvidencias([...evidencias, result.assets[0].uri]);
    }
  };

  useEffect(() => {
    if (showImage) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [showImage]);

  const sumitIncidencia = async () => {
    try {
      setLoadingUser(true);
      const formData = new FormData();

      formData.append("id_infractor", incidenciaValues.id_infractor);
      formData.append("correo_infractor", incidenciaValues.correo_infractor);
      formData.append("nombre_infractor", incidenciaValues.nombre_infractor);
      formData.append("apellidos_infractor", incidenciaValues.apellidos_infractor);

      formData.append("placas", incidenciaValues.placas);
      formData.append("descripcion", incidenciaValues.descripcion);
      formData.append("lat", incidenciaValues.lat);
      formData.append("lng", incidenciaValues.lng);
      formData.append("fecha", incidenciaValues.fecha);

      // FOTO PRINCIPAL
      formData.append("imgPrincipal", {
        uri: foto,     // <-- esta es la uri recibida de la cámara
        name: "principal.jpg",
        type: "image/jpeg"
      });

      // EVIDENCIAS
      evidencias.forEach((uri, index) => {
        formData.append("evidencias", {
          uri,
          name: `evidencia_${index}.jpg`,
          type: "image/jpeg"
        });
      });

      const response = await fetch(`${HOST_BACKEND_IOS}/create-incidence`, {
        method: "POST",
        body: formData,   // NO pongas headers, RN los setea solo
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        // LIMPIAR FORMULARIO
        setIncidenciaValues(prev => ({
          ...prev,
          placas: "",
          lat: null,
          lng: null,
          fecha: "",
          descripcion: "",
          id_infractor: "",
          correo_infractor: "",
          nombre_infractor: "",
          apellidos_infractor: "",
        }));
        setLoadingUser(false);
        router.back();
      } else {
        setLoadingUser(false);
        alert("Error al enviar la incidencia");
      }
    } catch (error) {
      setLoadingUser(false);
      alert("Error al enviar la incidencia");
    }
  };


  return (
    <>
      <Stack.Screen
        options={{
          title: "Incidencia",
          headerBackTitle: "Volver",
          headerStyle: { backgroundColor: "#c3cbd4" },
          headerTintColor: "#1e293b",
        }}
      />

      <ScrollView style={styles.container}>

        <Text style={styles.title}>Registro de incidencia</Text>

        {/* Imagen principal */}
        <Pressable onPress={() => setShowImage(true)} style={styles.imageContainer}>
          <Image source={{ uri: foto }} style={styles.image} />
          <Text style={styles.tapLabel}>Toca para ampliar</Text>
        </Pressable>

        <TextInput
          label="Placa detectada"
          value={incidenciaValues.placas}
          mode="outlined"
          style={styles.input}
          onChangeText={(text) =>
            setIncidenciaValues({ ...incidenciaValues, placas: text })
          }
        />

        <TextInput
          label="Descripcion"
          value={incidenciaValues.descripcion}
          mode="outlined"
          style={styles.input}
          onChangeText={(text) =>
            setIncidenciaValues({ ...incidenciaValues, descripcion: text })
          }
        />

        <TextInput label="Latitud" value={String(incidenciaValues.lat)} mode="outlined" disabled style={styles.input} />
        <TextInput label="Longitud" value={String(incidenciaValues.lng)} mode="outlined" disabled style={styles.input} />
        <TextInput label="Fecha y hora" value={incidenciaValues.fecha} mode="outlined" disabled style={styles.input} />

        {/* Evidencias */}
        <Text style={styles.subTitle}>Evidencia (opcional)</Text>

        <Button mode="outlined" onPress={addEvidencia} style={styles.buttonAdd}>Agregar imagen</Button>

        <View style={styles.evidenciasContainer}>
          {evidencias.map((uri, index) => (
            <Pressable
              key={index}
              onLongPress={() =>
                setEvidencias(evidencias.filter((_, i) => i !== index))
              }
            >
              <Image source={{ uri }} style={styles.evidenciaMini} />
              <Text style={styles.deleteLabel}>Eliminar</Text>
            </Pressable>
          ))}
        </View>

        <Button mode="contained" onPress={sumitIncidencia} style={styles.button} disabled={loadingUser}>{loadingUser ? "Creando incidencia..." : "Crear incidencia"}</Button>

      </ScrollView>

      {/* Modal de imagen aumentada */}
      <Modal visible={showImage} transparent>
        <Pressable style={styles.modalContainer} onPress={() => setShowImage(false)}>
          <Animated.Image
            source={{ uri: foto }}
            style={[styles.fullImage, { opacity: fadeAnim }]}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#eef1f5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 10,
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center',
  },
  image: { width: '100%', height: 200, borderRadius: 12 },
  tapLabel: { marginTop: 6, fontSize: 13, color: '#64748b' },
  input: { marginBottom: 14 },
  button: { marginTop: 20, paddingVertical: 7 },
  buttonAdd: { marginBottom: 10 },

  evidenciasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  evidenciaMini: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  deleteLabel: {
    textAlign: 'center',
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: { width: '100%', height: '80%' },
});
