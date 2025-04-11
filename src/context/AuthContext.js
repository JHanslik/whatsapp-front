import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken, clearAuthToken } from "../services/authStorage";

// Clés pour AsyncStorage
const LOGOUT_TIME_KEY = "whatsapp_logout_time";
const USER_KEY = "user";
const TOKEN_KEY = "token";

// Création du contexte d'authentification
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [lastLogoutTime, setLastLogoutTime] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  // Vérifier s'il y a eu une déconnexion précédente et si l'utilisateur est déjà connecté
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Vérifier si un utilisateur est déjà connecté
        const userJson = await AsyncStorage.getItem(USER_KEY);
        const token = await AsyncStorage.getItem(TOKEN_KEY);

        if (userJson && token) {
          const user = JSON.parse(userJson);
          console.log("Utilisateur trouvé dans le stockage:", user);
          await setAuthToken(token);
          setUserId(user._id);
          setIsAuthenticated(true);
        }

        // Vérifier s'il y a eu une déconnexion précédente
        const storedLogoutTime = await AsyncStorage.getItem(LOGOUT_TIME_KEY);
        if (storedLogoutTime) {
          setLastLogoutTime(storedLogoutTime);
          // Afficher la modal de déconnexion seulement si l'utilisateur s'est reconnecté
          if (userJson && token) {
            setShowLogoutModal(true);
          }
        }

        setInitialAuthCheckDone(true);
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation de l'authentification:",
          error
        );
        setInitialAuthCheckDone(true);
      }
    };

    initializeAuth();
  }, []);

  // Fonction de connexion
  const login = async (token, user) => {
    try {
      // Stocker le token dans AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, token);

      // Stocker l'objet utilisateur dans AsyncStorage
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log("Utilisateur stocké dans AsyncStorage:", user);

      // Mettre à jour le token d'authentification
      await setAuthToken(token);
      setUserId(user._id);
      setIsAuthenticated(true);

      // Vérifier s'il y a eu une déconnexion précédente
      const storedLogoutTime = await AsyncStorage.getItem(LOGOUT_TIME_KEY);
      if (storedLogoutTime) {
        setLastLogoutTime(storedLogoutTime);
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

      // Effacer le token et les données utilisateur
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

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

  if (!initialAuthCheckDone) {
    return null; // Ou un composant de chargement
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userId,
        login,
        logout,
        lastLogoutTime,
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
