import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { Accelerometer } from "expo-sensors";
import "./src/translations/i18n";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import { View, Switch } from "react-native";
import LogoutInfoModal from "./src/components/LogoutInfoModal";

// Importer nos écrans
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AddContactScreen from "./src/screens/AddContactScreen";
import ConversationScreen from "./src/screens/ConversationScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createStackNavigator();

const AppContent = () => {
  const { t, i18n } = useTranslation();
  const { theme, currentTheme, toggleTheme } = useTheme();
  const [orientation, setOrientation] = useState("PORTRAIT");

  useEffect(() => {
    // Déverrouiller l'orientation au démarrage
    ScreenOrientation.unlockAsync();

    // Configuration de l'accéléromètre
    Accelerometer.setUpdateInterval(500); // Augmenter la fréquence de mise à jour

    const subscription = Accelerometer.addListener((accelerometerData) => {
      const { x, y } = accelerometerData;
      // Ajuster les seuils de détection
      if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) {
        if (orientation !== "LANDSCAPE") {
          ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
          );
          setOrientation("LANDSCAPE");
        }
      } else {
        if (orientation !== "PORTRAIT") {
          ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP
          );
          setOrientation("PORTRAIT");
        }
      }
    });

    return () => {
      subscription.remove();
      // Restaurer l'orientation par défaut lors du démontage
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    };
  }, [orientation]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" hidden={true} />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.primary,
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            cardStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: t("auth.login") }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: t("auth.register") }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: t("profile.edit") }}
          />
          <Stack.Screen
            name="AddContact"
            component={AddContactScreen}
            options={{ title: t("chat.newMessage") }}
          />
          <Stack.Screen
            name="Conversation"
            component={ConversationScreen}
            options={({ route }) => ({
              title: route.params?.contactName || t("chat.newMessage"),
              headerStyle: {
                backgroundColor: theme.primary,
              },
              headerTintColor: "#fff",
              headerRight: () => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 10,
                  }}
                >
                  <Switch
                    value={currentTheme === "dark"}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={currentTheme === "dark" ? "#f5dd4b" : "#f4f3f4"}
                  />
                </View>
              ),
            })}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: t("settings.title") }}
          />
        </Stack.Navigator>

        <LogoutInfoModal />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
