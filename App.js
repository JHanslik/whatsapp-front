import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./src/translations/i18n";
import { useTranslation } from "react-i18next";

// Importer nos écrans
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AddContactScreen from "./src/screens/AddContactScreen";
import ConversationScreen from "./src/screens/ConversationScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createStackNavigator();

export default function App() {
  const { t, i18n } = useTranslation();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" hidden={true} />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#075E54", // Couleur WhatsApp
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
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
                backgroundColor: "#075E54",
              },
              headerTintColor: "#fff",
            })}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: t("settings.title") }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
