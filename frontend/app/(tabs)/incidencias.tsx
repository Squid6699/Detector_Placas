import { Image } from "expo-image";
import { StyleSheet, View, ScrollView, Modal, Button, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Constants from "expo-constants";
import { MotiView } from "moti";
import { useState } from "react";

const getImageUrl = (path: string | null, host: string) => {
  if (!path) return null;

  const cleanedPath = path.replace(/['"\[\]]+/g, "").trim();

  const normalizedPath = cleanedPath.replace(/\\/g, "/").replace(/^\/+/, "");

  return `${host.replace(/\/$/, "")}/${normalizedPath}`;
};

const parseFotosEvidencia = (fotos: string | null) => {
  if (!fotos) return [];

  let paths: string[] = [];

  try {
    const parsed = JSON.parse(fotos);
    if (Array.isArray(parsed)) {
      paths = parsed.map((p: string) => p.replace(/['"\[\]]+/g, "").trim());
    } else {
      paths = fotos.split(",").map(p => p.replace(/['"\[\]]+/g, "").trim());
    }
  } catch (e) {
    paths = fotos.split(",").map(p => p.replace(/['"\[\]]+/g, "").trim());
  }

  // Filtrar paths vacíos
  return paths.filter(p => p.length > 0);
};


export default function TabTwoScreen() {
  const HOST_BACKEND_IOS = Constants.expoConfig?.extra?.HOST_BACKEND_IOS;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["incidencias"],
    queryFn: fetchIncidencias,
  });

  async function fetchIncidencias() {
    const res = await fetch(`${HOST_BACKEND_IOS}/obtener-incidencias`);

    if (!res.ok) {
      throw new Error(`Error al obtener incidencias: ${res.statusText}`);
    }
    const data = await res.json();
    return data.incidencias;
  }

  const openModal = (incidencia: any) => {
    setSelectedIncidencia(incidencia);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedIncidencia(null);
  };

  // Prepara las fotos de evidencia para el modal
  const fotosEvidencia = parseFotosEvidencia(selectedIncidencia?.fotos_evidencia);


  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingTop: Constants.statusBarHeight + 35,
        }}
      >
        {isLoading && <ThemedText>Cargando incidencias...</ThemedText>}
        {error && <ThemedText>Error al cargar: {error.message}</ThemedText>}

        {data?.map((item, index) => {
          const imageUrl = getImageUrl(item.foto_principal, HOST_BACKEND_IOS);

          return (
            <MotiView
              key={item.id_incidencia}
              style={styles.card}
              from={{ opacity: 0, translateY: 25 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 120, type: "timing" }}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.img}
                contentFit="cover"
                transition={250}
                onError={(e) => console.log("Error cargando imagen:", e.nativeEvent.error, "URL:", imageUrl)}
              />

              <View style={styles.cardContent}>
                <ThemedText type="subtitle" style={styles.title}>
                  {item.descripcion}
                </ThemedText>

                <View style={styles.row}>
                  <IconSymbol name="calendar" size={18} color="#555" />
                  <ThemedText style={styles.meta}>
                    {new Date(item.fecha).toLocaleString()}
                  </ThemedText>
                </View>

                <View style={styles.row}>
                  <IconSymbol name="car" size={18} color="#555" />
                  <ThemedText style={styles.meta}>
                    Placa: {item.placa_vehiculo}
                  </ThemedText>
                </View>

                <View style={styles.row}>
                  <IconSymbol name="person" size={18} color="#555" />
                  <ThemedText style={styles.meta}>
                    Reportado por: {item.usuario_reportador}
                  </ThemedText>
                </View>

                <Button title="Ver detalles" onPress={() => openModal(item)} />
              </View>
            </MotiView>
          );
        })}
      </ScrollView>

      {/* Modal de detalles */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {selectedIncidencia && (
                <>
                  <ThemedText type="title" style={styles.modalTitle}>
                    {selectedIncidencia.descripcion}
                  </ThemedText>

                  {/* Foto Principal */}
                  <ThemedText style={styles.modalSubtitle}>Foto Principal</ThemedText>
                  <Image
                    source={{ uri: getImageUrl(selectedIncidencia.foto_principal, HOST_BACKEND_IOS) }}
                    style={styles.modalMainImage}
                    contentFit="cover"
                    transition={250}
                    onError={(e) => console.log("Error cargando foto principal del modal:", e.nativeEvent.error)}
                  />

                  {/* Datos de la Incidencia */}
                  <ThemedText style={styles.modalSubtitle}>Detalles</ThemedText>

                  <ThemedText style={styles.modalText}>
                    <IconSymbol name="calendar" size={18} color="#555" />{" "}
                    <ThemedText style={styles.modalLabel}>Fecha:</ThemedText>{" "}
                    {new Date(selectedIncidencia.fecha).toLocaleString()}
                  </ThemedText>

                  <ThemedText style={styles.modalText}>
                    <IconSymbol name="car" size={18} color="#555" />{" "}
                    <ThemedText style={styles.modalLabel}>Placa:</ThemedText>{" "}
                    {selectedIncidencia.placa_vehiculo}
                  </ThemedText>

                  <ThemedText style={styles.modalText}>
                    <IconSymbol name="map" size={18} color="#555" />{" "}
                    <ThemedText style={styles.modalLabel}>Coordenadas:</ThemedText>{" "}
                    {selectedIncidencia.latitud}, {selectedIncidencia.longitud}
                  </ThemedText>

                  <ThemedText style={styles.modalText}>
                    <IconSymbol name="person" size={18} color="#555" />{" "}
                    <ThemedText style={styles.modalLabel}>Reportado por:</ThemedText>{" "}
                    {selectedIncidencia.usuario_reportador}
                  </ThemedText>

                  <ThemedText style={styles.modalText}>
                    <IconSymbol name="person" size={18} color="#555" />{" "}
                    <ThemedText style={styles.modalLabel}>Propietario:</ThemedText>{" "}
                    {selectedIncidencia.usuario_propietario}
                  </ThemedText>

                  <ThemedText style={styles.modalText}>
                    <IconSymbol name="mail" size={18} color="#555" />{" "}
                    <ThemedText style={styles.modalLabel}>Email Propietario:</ThemedText>{" "}
                    {selectedIncidencia.email_propietario}
                  </ThemedText>


                  {/* Fotos de Evidencia */}
                  {fotosEvidencia.length > 0 && (
                    <>
                      <ThemedText style={styles.modalSubtitle}>Fotos de Evidencia</ThemedText>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.evidenceScrollContainer}
                      >
                        {fotosEvidencia.map((path, index) => {
                          const evidenceUrl = getImageUrl(path, HOST_BACKEND_IOS);
                          return (
                            <Image
                              key={index}
                              source={{ uri: evidenceUrl }}
                              style={styles.evidenceImage}
                              contentFit="cover"
                              transition={250}
                              onError={(e) =>
                                console.log(`Error cargando foto de evidencia ${index}:`, e.nativeEvent.error)
                              }
                            />
                          );
                        })}
                      </ScrollView>
                    </>
                  )}

                </>
              )}
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <Button title="Cerrar" onPress={closeModal} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef1f5", paddingHorizontal: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  img: { width: "100%", height: 210, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cardContent: { padding: 16, gap: 8 },
  title: { fontWeight: "bold", fontSize: 18, marginBottom: 6, color: "#222" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 14, color: "#555" },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "90%",
    maxHeight: '80%',
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalScrollContent: {
    paddingBottom: 15,
  },
  modalTitle: { fontWeight: "bold", fontSize: 20, marginBottom: 12, color: "#111" },
  modalSubtitle: { fontSize: 16, fontWeight: "bold", marginTop: 15, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4, color: "#111" },
  modalText: { marginBottom: 4, color: "#111" },
  modalLabel: { fontWeight: "bold", color: "#000" },

  modalMainImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  evidenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
    marginTop: 5,
  },
  evidenceImage: {
    width: 180, // Más grande para ScrollView horizontal
    height: 180,
    borderRadius: 10,
    marginRight: 10,
  },
  modalButtonContainer: {
    marginTop: 15,
  },

  evidenceScrollContainer: {
    paddingVertical: 5,
    gap: 10,
  },
});