import { api } from "./api"; // Nous allons exporter l'instance api

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  // Mettre à jour les headers de notre instance api
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = null;
  delete api.defaults.headers.common["Authorization"];
};
