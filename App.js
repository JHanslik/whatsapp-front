import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./src/translations/i18n";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { View, Switch } from "react-native";

// Importer nos écrans
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AddContactScreen from "./src/screens/AddContactScreen";
import ConversationScreen from "./src/screens/ConversationScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { t, i18n } = useTranslation();
  const { theme, currentTheme, toggleTheme } = useTheme();

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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                  <Switch
                    value={currentTheme === 'dark'}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={currentTheme === 'dark' ? '#f5dd4b' : '#f4f3f4'}
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
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
