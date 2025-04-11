import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const SettingsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { currentTheme, theme, setTheme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      t("auth.logoutConfirmTitle"),
      t("auth.logoutConfirm"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.ok"),
          onPress: async () => {
            await logout();
            navigation.navigate("Login");
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          {t("settings.title")}
        </Text>

        <View style={styles.sectionContent}>
          {/* Sélecteur de langue */}
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              {t("settings.language")}
            </Text>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  i18n.language === "fr" && styles.selectedLanguage,
                  { borderColor: theme.primary },
                ]}
                onPress={() => i18n.changeLanguage("fr")}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    i18n.language === "fr" && styles.selectedLanguageText,
                    { color: theme.primary },
                  ]}
                >
                  Français
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  i18n.language === "en" && styles.selectedLanguage,
                  { borderColor: theme.primary },
                ]}
                onPress={() => i18n.changeLanguage("en")}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    i18n.language === "en" && styles.selectedLanguageText,
                    { color: theme.primary },
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingItem}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>{t("auth.logout")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 15,
    margin: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  sectionContent: {
    marginTop: 10,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  languageButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  languageButton: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 5,
  },
  selectedLanguage: {
    backgroundColor: "#075E54",
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedLanguageText: {
    color: "#FFFFFF",
  },
  themeButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeButton: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 5,
  },
  selectedTheme: {
    backgroundColor: "#075E54",
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedThemeText: {
    color: "#FFFFFF",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SettingsScreen;
