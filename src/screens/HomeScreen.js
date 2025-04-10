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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import {
  logoutUser,
  getUserConversations,
  getConversationMessages,
  deleteConversation,
} from "../services/api";

const HomeScreen = ({ route, navigation }) => {
  const userId = route.params?.userId;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

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
      Alert.alert("Erreur", "Impossible de charger les conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    Alert.alert(
      "Supprimer la conversation",
      "Êtes-vous sûr de vouloir supprimer cette conversation ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
              // Recharger la liste des conversations
              loadConversations();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la conversation");
            }
          },
        },
      ]
    );
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
          <Text style={styles.actionText}>Profil</Text>
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
          <Text style={styles.actionText}>Nouveau Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
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
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Conversations récentes</Text>
    </>
  );

  const renderConversation = ({ item }) => {
    const otherParticipant =
      item.participants?.find((p) => p._id !== userId) || {};
    const lastMessageText = item.lastMessage
      ? item.lastMessage.text
      : "Aucun message";
    const lastMessageTime = item.lastMessage
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const contactName =
      otherParticipant.firstName && otherParticipant.lastName
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : "Contact inconnu";

    return (
      <View style={styles.conversationItem}>
        <TouchableOpacity
          style={styles.conversationContent}
          onPress={() =>
            navigation.navigate("Conversation", {
              conversationId: item._id,
              contactName: otherParticipant
                ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                : "Contact",
              userId: userId,
            })
          }
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
        >
          <MaterialIcons name="delete" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutUser();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            Alert.alert("Erreur", "Impossible de se déconnecter");
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#128C7E",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  logoutButton: {
    padding: 5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
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
  },
  actionButton: {
    alignItems: "center",
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
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
  },
  messageTime: {
    fontSize: 12,
    color: "#666",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginRight: 40,
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10,
  },
});

export default HomeScreen;
