import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Animated,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  logoutUser,
  getUserConversations,
  getConversationMessages,
  deleteConversation,
} from "../services/api";

const HomeScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const userId = route.params?.userId;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const fetchedConversations = await getUserConversations(userId);

      // Pour chaque conversation, récupérer le dernier message
      const conversationsWithLastMessage = await Promise.all(
        fetchedConversations.map(async (conv) => {
          const messages = await getConversationMessages(conv._id);
          return {
            ...conv,
            lastMessage:
              messages.length > 0 ? messages[messages.length - 1] : null,
          };
        })
      );

      // Trier les conversations par date du dernier message
      const sortedConversations = conversationsWithLastMessage.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
          new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
        );
      });

      setConversations(sortedConversations);
    } catch (error) {
      Alert.alert(t("common.error"), t("chat.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    Alert.alert(t("chat.deleteTitle"), t("chat.deleteConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteConversation(conversationId);
            // Recharger la liste des conversations
            loadConversations();
          } catch (error) {
            Alert.alert(t("common.error"), t("chat.deleteError"));
          }
        },
      },
    ]);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const renderHeader = () => (
    <>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Profile", { userId })}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#075E54" }]}>
            <Text style={styles.actionIconText}>👤</Text>
          </View>
          <Text style={styles.actionText}>{t("profile.edit")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("AddContact", {
              userId: route.params?.userId,
            })
          }
        >
          <View style={[styles.actionIcon, { backgroundColor: "#25D366" }]}>
            <Text style={styles.actionIconText}>💬</Text>
          </View>
          <Text style={styles.actionText}>{t("chat.newMessage")}</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: "#128C7E" }]}>
            <Text style={styles.actionIconText}>👥</Text>
          </View>
          <Text style={styles.actionText}>Groupes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: "#34B7F1" }]}>
            <Text style={styles.actionIconText}>📞</Text>
          </View>
          <Text style={styles.actionText}>Appels</Text>
        </TouchableOpacity> */}
      </View>

      <Text style={styles.sectionTitle}>{t("chat.recentConversations")}</Text>
    </>
  );

  const renderConversation = ({ item }) => {
    const otherParticipant =
      item.participants?.find((p) => p._id !== userId) || {};
    const lastMessageText = item.lastMessage
      ? item.lastMessage.text
      : t("chat.noMessages");
    const lastMessageTime = item.lastMessage
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const contactName =
      otherParticipant.firstName && otherParticipant.lastName
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : t("chat.unknownContact");

    return (
      <Animated.View
        style={[styles.conversationItem, { transform: [{ scale: scaleAnim }] }]}
      >
        <TouchableOpacity
          style={styles.conversationContent}
          onPress={() =>
            navigation.navigate("Conversation", {
              conversationId: item._id,
              contactName: otherParticipant
                ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                : t("chat.contact"),
              userId: userId,
            })
          }
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: "https://via.placeholder.com/50" }}
            style={styles.contactImage}
          />
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.contactName}>{contactName}</Text>
              <Text style={styles.messageTime}>{lastMessageTime}</Text>
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessageText}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteConversation(item._id)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleLogout = async () => {
    Alert.alert(t("auth.logout"), t("auth.logoutConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("auth.logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await logoutUser();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            Alert.alert(t("common.error"), t("auth.logoutError"));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WhatsApp</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile", { userId })}
          >
            <Image
              source={{ uri: "https://via.placeholder.com/40" }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des conversations avec header personnalisé */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        style={styles.conversationsList}
        onRefresh={loadConversations}
        refreshing={loading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#075E54",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 20,
    marginVertical: 15,
    letterSpacing: 0.5,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  conversationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#075E54",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.3,
  },
  messageTime: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginRight: 40,
    letterSpacing: 0.2,
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
});

export default HomeScreen;
