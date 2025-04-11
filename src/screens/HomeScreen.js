import React, { useState, useEffect, useRef } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getUserConversations,
  getConversationMessages,
  deleteConversation,
  getUserProfile,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const HomeScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const userId = route.params?.userId;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [userProfile, setUserProfile] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const intervalRef = useRef(null);
  const previousConversationsRef = useRef([]);

  useEffect(() => {
    loadConversations();
    loadUserProfile();

    // Configuration d'un intervalle pour rafraîchir les conversations automatiquement
    intervalRef.current = setInterval(() => {
      loadConversations();
      checkOpenedConversations();
    }, 1000); // Rafraîchissement toutes les secondes (au lieu de 5 secondes)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Vérifier si des conversations ont été ouvertes et réinitialiser leurs compteurs
  const checkOpenedConversations = async () => {
    try {
      const openedConversations = await AsyncStorage.getItem(
        "openedConversations"
      );

      if (openedConversations) {
        const conversationsArray = JSON.parse(openedConversations);

        if (conversationsArray.length > 0) {
          // Réinitialiser les compteurs pour ces conversations
          const updatedUnreadMessages = { ...unreadMessages };

          conversationsArray.forEach((convId) => {
            updatedUnreadMessages[convId] = 0;
          });

          setUnreadMessages(updatedUnreadMessages);

          // Vider la liste des conversations ouvertes
          await AsyncStorage.setItem("openedConversations", JSON.stringify([]));
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification des conversations ouvertes:",
        error
      );
    }
  };

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
            messages: messages,
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

      // Mettre à jour les messages non lus - ne réinitialiser que si on ouvre explicitement la conversation
      if (previousConversationsRef.current.length > 0) {
        const updatedUnreadMessages = { ...unreadMessages };

        sortedConversations.forEach((conv) => {
          const prevConv = previousConversationsRef.current.find(
            (c) => c._id === conv._id
          );

          if (prevConv && prevConv.messages && conv.messages) {
            // Compter les nouveaux messages (messages reçus et non envoyés par l'utilisateur)
            const newMessages = conv.messages.filter(
              (msg) =>
                !prevConv.messages.some((m) => m._id === msg._id) &&
                String(msg.senderId._id || msg.senderId) !== String(userId)
            );

            if (newMessages.length > 0) {
              updatedUnreadMessages[conv._id] =
                (updatedUnreadMessages[conv._id] || 0) + newMessages.length;

              // Mise à jour atomique pour éviter les pertes de mises à jour
              setUnreadMessages((prev) => ({
                ...prev,
                [conv._id]: (prev[conv._id] || 0) + newMessages.length,
              }));
            }
          }
        });
      }

      // Sauvegarder l'état actuel pour la prochaine comparaison
      previousConversationsRef.current = sortedConversations.map((conv) => ({
        ...conv,
        messages: [...(conv.messages || [])],
      }));

      setConversations(sortedConversations);
    } catch (error) {
      Alert.alert(t("common.error"), t("chat.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
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

  const handleConversationPress = (item) => {
    const conversationId = item._id;

    // Réinitialiser le compteur de messages non lus pour cette conversation
    // Mise à jour immédiate et persistante
    setUnreadMessages((prev) => ({
      ...prev,
      [conversationId]: 0,
    }));

    // Marquer également cette conversation comme lue dans AsyncStorage
    const markAsRead = async () => {
      try {
        const openedConversations =
          (await AsyncStorage.getItem("openedConversations")) || "[]";
        const conversations = JSON.parse(openedConversations);

        if (!conversations.includes(conversationId)) {
          conversations.push(conversationId);
          await AsyncStorage.setItem(
            "openedConversations",
            JSON.stringify(conversations)
          );
        }
      } catch (error) {
        console.error("Erreur lors du marquage comme lu:", error);
      }
    };

    markAsRead();

    const otherParticipant =
      item.participants?.find((p) => p._id !== userId) || {};
    navigation.navigate("Conversation", {
      conversationId: conversationId,
      contactName: otherParticipant
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : t("chat.contact"),
      userId: userId,
    });
  };

  const renderConversation = ({ item }) => {
    const otherParticipant =
      item.participants?.find((p) => p._id !== userId) || {};
    const lastMessageText = item.lastMessage
      ? item.lastMessage.text
      : t("chat.noMessages");

    // Ajout du jour à l'affichage de l'heure
    const lastMessageTime = item.lastMessage
      ? formatMessageDate(new Date(item.lastMessage.createdAt))
      : "";

    const contactName =
      otherParticipant.firstName && otherParticipant.lastName
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : t("chat.unknownContact");

    // Utiliser l'image de profil de l'utilisateur ou une image par défaut
    const profileImageUri = otherParticipant.profileImage
      ? otherParticipant.profileImage
      : "https://via.placeholder.com/50";

    // Nombre de messages non lus pour cette conversation
    const unreadCount = unreadMessages[item._id] || 0;

    // Déterminer si le dernier message est nouveau (non lu)
    const isNewMessage = unreadCount > 0;

    return (
      <Animated.View
        style={[styles.conversationItem, { transform: [{ scale: scaleAnim }] }]}
      >
        <TouchableOpacity
          style={styles.conversationContent}
          onPress={() => handleConversationPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: profileImageUri }}
            style={styles.contactImage}
          />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.contactName}>{contactName}</Text>
              <Text style={styles.messageTime}>{lastMessageTime}</Text>
            </View>
            <Text
              style={[styles.lastMessage, isNewMessage && styles.newMessage]}
              numberOfLines={1}
            >
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

  // Fonction pour formater la date du message avec le jour
  const formatMessageDate = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Format pour l'heure uniquement
    const timeFormat = {
      hour: "2-digit",
      minute: "2-digit",
    };

    // Aujourd'hui: afficher seulement l'heure
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], timeFormat);
    }
    // Hier: afficher "Hier" et l'heure
    else if (messageDate.getTime() === yesterday.getTime()) {
      return `${t("common.yesterday")} ${date.toLocaleTimeString(
        [],
        timeFormat
      )}`;
    }
    // Cette semaine: afficher le jour et l'heure
    else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return `${date.toLocaleDateString([], {
        weekday: "short",
      })} ${date.toLocaleTimeString([], timeFormat)}`;
    }
    // Plus ancien: afficher la date complète
    else {
      return date.toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert(t("auth.logoutConfirmTitle"), t("auth.logoutConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.ok"),
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
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
              source={{
                uri: userProfile?.profileImage
                  ? userProfile.profileImage
                  : "https://via.placeholder.com/40",
              }}
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
  unreadBadge: {
    position: "absolute",
    backgroundColor: "#25D366",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    left: 40,
    top: 5,
    paddingHorizontal: 5,
    zIndex: 1,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  newMessage: {
    fontWeight: "bold",
    color: "#333",
  },
});

export default HomeScreen;
