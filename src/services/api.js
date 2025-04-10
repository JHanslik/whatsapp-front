import axios from "axios";
import { API_URL } from "@env";
import { Platform } from "react-native";

let baseURL = API_URL;
if (!baseURL) {
  baseURL = __DEV__
    ? Platform.OS === "android"
      ? "http://10.0.2.2:5000/api"
      : "http://localhost:5000/api"
    : "http://votre-serveur-de-production.com/api";
}

export const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const registerUser = async (userData) => {
  try {
    const response = await api.post("/users/register", userData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/users/login", credentials);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await api.put(`/users/${userId}`, profileData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const addContact = async (userId, contactId) => {
  try {
    const response = await api.post("/contacts/add", { userId, contactId });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const searchContact = async (phone) => {
  try {
    const formattedPhone = phone.startsWith("+")
      ? phone
      : `+33${phone.replace(/^0/, "")}`;
    const response = await api.get(
      `/users/search/${encodeURIComponent(formattedPhone)}`
    );
    if (!response.data) {
      throw new Error("Contact non trouvé");
    }
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserContacts = async (userId) => {
  try {
    const response = await api.get(`/contacts/user/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateContactAlias = async (contactId, alias) => {
  try {
    const response = await api.put(`/contacts/${contactId}/alias`, { alias });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteContact = async (contactId) => {
  try {
    const response = await api.delete(`/contacts/${contactId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const logoutUser = async () => {
  try {
    return { success: true };
  } catch (error) {
    handleApiError(error);
  }
};

const handleApiError = (error) => {
  if (error.response) {
    throw error.response.data;
  } else if (error.request) {
    throw new Error("Le serveur ne répond pas");
  } else {
    throw new Error("Erreur réseau: " + error.message);
  }
};
