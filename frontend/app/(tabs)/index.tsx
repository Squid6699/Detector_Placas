import { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from "expo-router";


export default function index() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const tomarFoto = async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);

      // Tomar foto
      const foto = await cameraRef.current.takePictureAsync({
        base64: false,
      });

      // Obtener ubicación
      const { getCurrentPositionAsync, requestForegroundPermissionsAsync } = await import('expo-location');
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      const location = await getCurrentPositionAsync();
      const { latitude, longitude } = location.coords;

      // Obtener fecha/hora actual
      const fechaHora = new Date().toISOString();

      // Armar formulario
      const formData = new FormData();
      formData.append("image", {
        uri: foto.uri,
        name: "placa.jpg",
        type: "image/jpeg"
      } as any);

      // Enviar al servidor
      const response = await fetch("http://192.168.100.11:5000/detectar-placa", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      const result = await response.json();

      if (result.success) {
        router.push({
          pathname: "/pages/Incidencia",
          params: {
            placas: JSON.stringify(result.placas),
            lat: latitude.toString(),
            lng: longitude.toString(),
            fecha: fechaHora.toString(),
          }
        });

      } else {
        alert("No se detectó ninguna placa.");
      }

    } catch (error) {
      console.error(error);
      alert("Error enviando la foto");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionText}>Conceder permiso de cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />

      {/* Botón de captura */}
      {!loading && (
        <TouchableOpacity style={styles.captureButton} onPress={tomarFoto}>
          <Text style={styles.captureText}>Capturar</Text>
        </TouchableOpacity>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  permissionButton: {
    backgroundColor: '#1E90FF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 50,
  },
  permissionText: { color: '#fff', fontWeight: 'bold' },

  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#ffffffaa',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  captureText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },

  loadingContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
});
