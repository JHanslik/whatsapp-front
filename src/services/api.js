import axios from "axios";
import { API_URL } from "@env";
import { Platform } from "react-native";

// Vérification que la variable d'environnement est définie
if (!API_URL) {
  console.error("Erreur: Variable d'environnement API_URL non définie");

  // Utiliser une URL par défaut si API_URL n'est pas définie
  API_URL = __DEV__
    ? Platform.OS === "android"
      ? "http://10.0.2.2:5000/api" // Pour l'émulateur Android
      : "http://localhost:5000/api" // Pour l'émulateur iOS
    : "http://votre-serveur-de-production.com/api"; // Pour la production
}

console.log("URL de l'API configurée:", API_URL);

// En fonction du contexte d'exécution, vous pourriez avoir besoin de différentes adresses IP
// const API_URL = __DEV__
//   ? Platform.OS === 'android'
//     ? 'http://10.0.2.2:5000/api'  // Pour l'émulateur Android
//     : 'http://localhost:5000/api' // Pour l'émulateur iOS
//   : 'http://192.168.1.81:5000/api'; // Pour les appareils physiques sur le même réseau

export const registerUser = async (userData) => {
  try {
    console.log("Tentative d'envoi des données:", userData);
    console.log("URL de l'API:", `${API_URL}/users/register`);

    const response = await axios.post(`${API_URL}/users/register`, userData);
    console.log("Réponse reçue:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur détaillée:", error);
    if (error.response) {
      // La requête a été effectuée et le serveur a répondu avec un code d'état
      console.error("Réponse d'erreur:", error.response.data);
      console.error("Statut:", error.response.status);
      throw error.response.data;
    } else if (error.request) {
      // La requête a été effectuée mais aucune réponse n'a été reçue
      console.error("Aucune réponse du serveur:", error.request);
      throw new Error(
        "Le serveur ne répond pas. Vérifiez qu'il est bien démarré."
      );
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error("Erreur de configuration:", error.message);
      throw new Error("Erreur de configuration: " + error.message);
    }
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, credentials);
    return response.data;
  } catch (error) {
    console.error("Erreur de connexion:", error);
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      throw new Error("Le serveur ne répond pas");
    } else {
      throw new Error("Erreur réseau: " + error.message);
    }
  }
};

// Nouvelle fonction pour mettre à jour le profil utilisateur
export const updateUserProfile = async (userId, profileData) => {
  try {
    console.log(
      "Tentative de mise à jour du profil pour l'utilisateur:",
      userId
    );
    console.log("Données à mettre à jour:", profileData);

    const response = await axios.put(`${API_URL}/users/${userId}`, profileData);
    console.log("Réponse de mise à jour reçue:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur de mise à jour du profil:", error);
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      throw new Error("Le serveur ne répond pas");
    } else {
      throw new Error("Erreur réseau: " + error.message);
    }
  }
};

// Fonction pour récupérer les informations du profil
export const getUserProfile = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      throw new Error("Le serveur ne répond pas");
    } else {
      throw new Error("Erreur réseau: " + error.message);
    }
  }
};

export const addContact = async (userId, contactId) => {
  try {
    console.log("Ajout du contact:", { userId, contactId });
    const response = await axios.post(`${API_URL}/contacts/add`, {
      userId,
      contactId, // Maintenant nous envoyons l'ID du contact et non le numéro de téléphone
    });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'ajout du contact:", error);
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      throw new Error("Le serveur ne répond pas");
    } else {
      throw new Error("Erreur réseau: " + error.message);
    }
  }
};

export const searchContact = async (phone) => {
  try {
    // Formater le numéro de téléphone si nécessaire
    const formattedPhone = phone.startsWith("+")
      ? phone
      : `+33${phone.replace(/^0/, "")}`;
    console.log("Recherche du numéro:", formattedPhone);

    const response = await axios.get(
      `${API_URL}/users/search/${encodeURIComponent(formattedPhone)}`
    );

    if (!response.data) {
      throw new Error("Contact non trouvé");
    }

    console.log("Réponse de recherche:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur détaillée:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw new Error(error.response?.data?.message || "Contact non trouvé");
  }
};

// Fonction pour déconnecter l'utilisateur
export const logoutUser = async () => {
  try {
    // Dans une application réelle, vous pourriez vouloir appeler une API de déconnexion
    // Pour l'instant, nous allons simplement nettoyer le stockage local
    // et retourner un succès
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    throw new Error("Erreur lors de la déconnexion");
  }
};
