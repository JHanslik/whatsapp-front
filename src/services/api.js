import axios from "axios";
import { API_URL } from "@env";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Interceptor pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
    const url = `/users/search/${encodeURIComponent(phone)}`;
    const response = await api.get(url);

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

export const createConversation = async (participants) => {
  try {
    const response = await api.post("/conversations", { participants });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserConversations = async (userId) => {
  try {
    const response = await api.get(`/conversations/user/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createMessage = async ({ conversationId, senderId, text }) => {
  try {
    const response = await api.post("/messages", {
      conversationId,
      senderId,
      text,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getConversationMessages = async (conversationId) => {
  try {
    const response = await api.get(`/messages/conversation/${conversationId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
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
