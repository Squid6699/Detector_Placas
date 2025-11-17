import { View, Text, TextInput, Button } from 'react-native';
import { useLocalSearchParams } from "expo-router";

export default function Incidencia() {
  const params = useLocalSearchParams();

  const placas = JSON.parse(params.placas);
  const lat = Number(params.lat);
  const lng = Number(params.lng);
  const fecha = String(params.fecha);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Formulario</Text>

      <Text>Placa detectada:</Text>
      <TextInput value={placas} editable={false} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Text>Latitud:</Text>
      <TextInput value={String(lat)} editable={false} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Text>Longitud:</Text>
      <TextInput value={String(lng)} editable={false} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Text>Fecha/Hora:</Text>
      <TextInput value={fecha} editable={false} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Button title="Enviar datos" onPress={() => { }} />
    </View>
  );
}


