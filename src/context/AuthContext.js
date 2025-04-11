import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken, clearAuthToken } from "../services/authStorage";

// Clés pour AsyncStorage
const LOGOUT_TIME_KEY = "whatsapp_logout_time";

// Création du contexte d'authentification
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [lastLogoutTime, setLastLogoutTime] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutDuration, setLogoutDuration] = useState("");

  // Fonction pour calculer la durée depuis la déconnexion
  const calculateLogoutDuration = (logoutTime) => {
    if (!logoutTime) return "";

    const now = new Date();
    const lastLogout = new Date(logoutTime);
    const diffInMs = now - lastLogout;

    // Calculer les heures, minutes et secondes
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  };

  // Vérifier s'il y a eu une déconnexion précédente au chargement
  useEffect(() => {
    const checkLastLogout = async () => {
      try {
        const storedLogoutTime = await AsyncStorage.getItem(LOGOUT_TIME_KEY);
        if (storedLogoutTime) {
          const duration = calculateLogoutDuration(storedLogoutTime);
          setLastLogoutTime(storedLogoutTime);
          setLogoutDuration(duration);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du temps de déconnexion:",
          error
        );
      }
    };

    checkLastLogout();
  }, []);

  // Fonction de connexion
  const login = async (token, user) => {
    try {
      await setAuthToken(token);
      setUserId(user._id);
      setIsAuthenticated(true);

      // Vérifier s'il y a eu une déconnexion précédente
      const storedLogoutTime = await AsyncStorage.getItem(LOGOUT_TIME_KEY);
      if (storedLogoutTime) {
        const duration = calculateLogoutDuration(storedLogoutTime);
        setLastLogoutTime(storedLogoutTime);
        setLogoutDuration(duration);
        setShowLogoutModal(true);
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Enregistrer l'heure de déconnexion
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LOGOUT_TIME_KEY, now);

      // Effacer le token
      await clearAuthToken();
      setIsAuthenticated(false);
      setUserId(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Fermer la modal
  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userId,
        login,
        logout,
        lastLogoutTime,
        logoutDuration,
        showLogoutModal,
        closeLogoutModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
