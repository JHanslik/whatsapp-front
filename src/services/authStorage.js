import { api } from "./api"; // Nous allons exporter l'instance api
import AsyncStorage from "@react-native-async-storage/async-storage";

let authToken = null;

export const setAuthToken = async (token) => {
  authToken = token;

  // Mettre à jour les headers de notre instance api
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // Pour être sûr que le token est stocké
    await AsyncStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    // Supprimer le token si null
    await AsyncStorage.removeItem("token");
  }
};

export const getAuthToken = () => authToken;

export const clearAuthToken = async () => {
  authToken = null;
  delete api.defaults.headers.common["Authorization"];
  await AsyncStorage.removeItem("token");
};
