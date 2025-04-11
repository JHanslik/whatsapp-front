import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import * as FileSystem from "expo-file-system";

const ProfileImageUploader = ({ currentImage, onImageUpdate }) => {
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin de la permission pour accéder à votre galerie."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        presentationStyle: "fullScreen",
      });

      if (!result.canceled) {
        console.log("Image sélectionnée:", result.assets[0]);
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la sélection de l'image."
      );
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setLoading(true);
      console.log("Début du téléchargement de l'image...");

      // Créer un nom de fichier unique
      const fileName = imageAsset.uri.split("/").pop();
      const fileType = imageAsset.mimeType || "image/jpeg";

      // Lire le fichier en base64 si nécessaire
      let fileUri = imageAsset.uri;
      if (Platform.OS === "android" && fileUri.startsWith("file://")) {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileUri = `data:${fileType};base64,${base64}`;
      }

      const token = await AsyncStorage.getItem("token");
      console.log("Token d'authentification:", token ? "Présent" : "Absent");

      // Récupérer l'ID utilisateur
      const userData = await AsyncStorage.getItem("user");
      console.log("Données utilisateur brutes:", userData);
      const userId = userData ? JSON.parse(userData)._id : null;
      console.log("ID utilisateur:", userId);

      if (!userId) {
        console.error("Impossible de récupérer l'ID utilisateur");
        Alert.alert(
          "Erreur",
          "Impossible de récupérer votre identifiant utilisateur. Veuillez vous reconnecter."
        );
        return;
      }

      // Utiliser uniquement l'URL avec l'ID utilisateur comme paramètre
      const url = `/users/profile-image/${userId}`;
      console.log("URL utilisée:", url);

      const formData = new FormData();
      formData.append("profileImage", {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });

      console.log("Envoi de la requête...");

      const response = await api.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        transformRequest: (data) => data,
        timeout: 10000, // Augmenter le timeout à 10 secondes
      });

      console.log("Réponse reçue:", response.data);
      onImageUpdate(response.data.profileImage);
      Alert.alert("Succès", "Image de profil mise à jour avec succès");
    } catch (error) {
      console.error(
        "Erreur détaillée lors du téléchargement:",
        error.response?.data || error
      );
      Alert.alert(
        "Erreur",
        error.response?.data?.message ||
          "Une erreur est survenue lors du téléchargement de l'image."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} disabled={loading}>
        <View style={styles.imageContainer}>
          {currentImage ? (
            <Image source={{ uri: currentImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="person" size={50} color="#666" />
            </View>
          )}
          <View style={styles.editIcon}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="camera" size={24} color="#fff" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#075E54",
    padding: 8,
    borderRadius: 20,
  },
});

export default ProfileImageUploader;
