import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./en";
import fr from "./fr";

const LANGUAGE_DETECTOR = {
  type: "languageDetector",
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem("user-language");
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      return callback("fr");
    } catch (error) {
      console.log("Error reading language", error);
      return callback("fr");
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem("user-language", language);
    } catch (error) {
      console.log("Error saving language", error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      fr,
      en,
    },
    fallbackLng: "fr",
    compatibilityJSON: "v3",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
