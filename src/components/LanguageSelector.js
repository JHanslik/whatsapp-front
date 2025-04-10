import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("settings.language")}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === "fr" && styles.activeButton,
          ]}
          onPress={() => i18n.changeLanguage("fr")}
        >
          <Text style={styles.buttonText}>Français</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === "en" && styles.activeButton,
          ]}
          onPress={() => i18n.changeLanguage("en")}
        >
          <Text style={styles.buttonText}>English</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  languageButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    minWidth: 100,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#075E54",
  },
  buttonText: {
    fontSize: 16,
    color: "#000",
  },
});

export default LanguageSelector;
