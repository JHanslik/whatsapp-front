import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { registerUser } from "../services/api";

const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!phone || !firstName || !lastName || !password || !confirmPassword) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsDontMatch"));
      return false;
    }

    // Nouvelle validation du numéro de téléphone qui accepte +33 et 0
    if (!/^(\+33|0)[1-9]\d{8}$/.test(phone)) {
      Alert.alert(t("common.error"), t("auth.invalidPhoneFormat"));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = { phone, firstName, lastName, password };
      await registerUser(userData);
      Alert.alert(t("common.success"), t("auth.registerSuccess"), [
        { text: t("common.ok"), onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      Alert.alert(t("common.error"), error.message || t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.register")}</Text>

      <TextInput
        style={styles.input}
        placeholder={t("profile.phone")}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

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

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("auth.register")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginText}>{t("auth.haveAccount")}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#075E54", // Couleur WhatsApp
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: "#E0E0E0",
    borderWidth: 1,
  },
  button: {
    backgroundColor: "#25D366", // Couleur WhatsApp
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#075E54", // Couleur WhatsApp
    fontSize: 16,
  },
});

export default RegisterScreen;
