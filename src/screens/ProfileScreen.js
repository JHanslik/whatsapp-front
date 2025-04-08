import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { getUserProfile, updateUserProfile } from "../services/api";

const ProfileScreen = ({ route, navigation }) => {
  // Dans une application réelle, vous obtiendriez l'ID de l'utilisateur
  // à partir du contexte d'authentification ou des paramètres de navigation
  const userId = route.params?.userId || "user-id-placeholder";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données du profil au chargement de l'écran
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setFetchingProfile(true);
        const userData = await getUserProfile(userId);
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setPhone(userData.phone || "");
        setError(null);
      } catch (err) {
        setError("Impossible de charger les informations du profil");
        Alert.alert(
          "Erreur",
          err.message || "Erreur lors du chargement du profil"
        );
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const validateForm = () => {
    if (!firstName || !lastName) {
      Alert.alert("Erreur", "Le prénom et le nom sont obligatoires");
      return false;
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
        return false;
      }

      // Validation du mot de passe (au moins 6 caractères)
      if (password.length < 6) {
        Alert.alert(
          "Erreur",
          "Le mot de passe doit contenir au moins 6 caractères"
        );
        return false;
      }
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Préparer les données à mettre à jour
      const profileData = {
        firstName,
        lastName,
      };

      // Ajouter le mot de passe seulement s'il a été modifié
      if (password) {
        profileData.password = password;
      }

      await updateUserProfile(userId, profileData);
      Alert.alert("Succès", "Profil mis à jour avec succès");

      // Réinitialiser les champs de mot de passe
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.message || "Échec de la mise à jour du profil"
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#075E54" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Modifier votre profil</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={lastName}
          onChangeText={setLastName}
        />

        <TextInput
          style={[styles.input, styles.disabledInput]}
          placeholder="Numéro de téléphone"
          value={phone}
          editable={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Changer de mot de passe</Text>
        <Text style={styles.sectionSubtitle}>
          Laissez vide pour conserver le mot de passe actuel
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nouveau mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleUpdateProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Mettre à jour le profil</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#075E54",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#075E54",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#075E54",
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 15,
    color: "#888",
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: "#E0E0E0",
    borderWidth: 1,
  },
  disabledInput: {
    backgroundColor: "#F0F0F0",
    color: "#888",
  },
  button: {
    backgroundColor: "#25D366",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#075E54",
    fontSize: 16,
  },
});

export default ProfileScreen;
