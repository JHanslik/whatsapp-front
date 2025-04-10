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
import { useTranslation } from "react-i18next";
import { getUserProfile, updateUserProfile } from "../services/api";

const ProfileScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  // Vérifier si l'ID utilisateur est présent dans les paramètres de route
  const userId = route.params?.userId;

  if (!userId) {
    Alert.alert(t("common.error"), t("profile.userIdNotFound"));
    navigation.navigate("Login");
    return null;
  }

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
        setError(t("profile.loadError"));
        Alert.alert(t("common.error"), err.message || t("profile.loadError"));
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const validateForm = () => {
    if (!firstName || !lastName) {
      Alert.alert(t("common.error"), t("profile.nameRequired"));
      return false;
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        Alert.alert(t("common.error"), t("auth.passwordsDontMatch"));
        return false;
      }

      // Validation du mot de passe (au moins 6 caractères)
      if (password.length < 6) {
        Alert.alert(t("common.error"), t("auth.passwordLength"));
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
      Alert.alert(t("common.success"), t("profile.updateSuccess"));

      // Réinitialiser les champs de mot de passe
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert(t("common.error"), error.message || t("profile.updateError"));
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#075E54" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>{t("profile.edit")}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.personalInfo")}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("profile.name")}
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder={t("profile.lastName")}
          value={lastName}
          onChangeText={setLastName}
        />

        <TextInput
          style={[styles.input, styles.disabledInput]}
          placeholder={t("profile.phone")}
          value={phone}
          editable={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.changePassword")}</Text>
        <Text style={styles.sectionSubtitle}>{t("profile.passwordHint")}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder={t("auth.confirmPassword")}
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
          <Text style={styles.buttonText}>{t("profile.saveChanges")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
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
