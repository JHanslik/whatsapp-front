import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.title")}</Text>

        <View style={styles.sectionContent}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t("settings.language")}</Text>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  i18n.language === "fr" && styles.selectedLanguage,
                ]}
                onPress={() => i18n.changeLanguage("fr")}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    i18n.language === "fr" && styles.selectedLanguageText,
                  ]}
                >
                  Français
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  i18n.language === "en" && styles.selectedLanguage,
                ]}
                onPress={() => i18n.changeLanguage("en")}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    i18n.language === "en" && styles.selectedLanguageText,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
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
    color: "#075E54",
  },
  sectionContent: {
    marginTop: 10,
  },
  settingItem: {
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#075E54",
  },
  languageButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  languageButton: {
    padding: 10,
    borderWidth: 2,
    borderColor: "#075E54",
    borderRadius: 5,
  },
  selectedLanguage: {
    backgroundColor: "#075E54",
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#075E54",
  },
  selectedLanguageText: {
    color: "#FFFFFF",
  },
});

export default SettingsScreen;
