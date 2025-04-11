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
  Modal,
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
  getUserContacts,
  addContact,
  deleteContact,
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
  const [userContacts, setUserContacts] = useState([]);
  const [newContactModal, setNewContactModal] = useState(false);
  const [pendingContact, setPendingContact] = useState(null);
  const intervalRef = useRef(null);
  const previousConversationsRef = useRef([]);
  const checkedConversationsRef = useRef(new Set());
  const previousUserContactsCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    // Forcer la réinitialisation lors du premier rendu
    checkedConversationsRef.current.clear();

    loadConversations();
    loadUserProfile();
    loadContacts();

    // Configuration d'un intervalle pour rafraîchir les conversations automatiquement
    intervalRef.current = setInterval(() => {
      loadConversations();
      checkOpenedConversations();

      // Périodiquement, réinitialiser les conversations vérifiées (toutes les minutes)
      const now = new Date();
      if (now.getSeconds() < 5) {
        // Dans les 5 premières secondes de chaque minute
        console.log("Réinitialisation périodique des conversations vérifiées");
        checkedConversationsRef.current.clear();
      }
    }, 3000); // Augmentation à 3 secondes pour réduire la pression sur l'API

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // États de la modale
  useEffect(() => {
    console.log("État de la modale:", newContactModal ? "visible" : "cachée");
    if (pendingContact) {
      console.log(
        "Contact en attente:",
        pendingContact.firstName,
        pendingContact.lastName
      );
    }
  }, [newContactModal, pendingContact]);

  // Fonction pour tester la modale manuellement (à enlever en production)
  const testModal = () => {
    console.log("Test de la modale");
    if (conversations.length > 0) {
      const conv = conversations[0];
      if (conv && conv.participants && conv.participants.length > 0) {
        const other = conv.participants.find(
          (p) => String(p._id) !== String(userId)
        );
        if (other) {
          console.log(
            "Test de la modale avec:",
            other.firstName,
            other.lastName
          );
          setPendingContact(other);
          setNewContactModal(true);
        } else {
          console.log("Aucun participant trouvé dans la conversation de test");
        }
      } else {
        console.log("Conversation de test invalide");
      }
    } else {
      console.log("Aucune conversation disponible pour le test");
      // Créer un utilisateur fictif pour tester
      const fakeUser = {
        _id: "test123",
        firstName: "Test",
        lastName: "Utilisateur",
        phone: "+33612345678",
        profileImage: "https://via.placeholder.com/80",
      };
      setPendingContact(fakeUser);
      setNewContactModal(true);
    }
  };

  // Charger les contacts de l'utilisateur
  const loadContacts = async () => {
    try {
      const contacts = await getUserContacts(userId);
      console.log("Contacts chargés:", contacts.length);
      setUserContacts(contacts);
    } catch (error) {
      console.error("Erreur lors du chargement des contacts:", error);
    }
  };

  // Vérifier si un utilisateur est déjà dans nos contacts
  const isContactInList = (participantId) => {
    console.log(
      "Vérification du contact:",
      participantId,
      "dans",
      userContacts.length,
      "contacts"
    );

    if (!userContacts || userContacts.length === 0) {
      console.log("Liste de contacts vide");
      return false;
    }

    // Pour déboguer, affichons les IDs de tous les contacts
    console.log(
      "IDs des contacts:",
      userContacts.map((c) => {
        const contactId = c.contactId && (c.contactId._id || c.contactId);
        return String(contactId);
      })
    );

    // S'assurer que participantId est bien défini
    if (!participantId) {
      console.log("ID de participant invalide:", participantId);
      return false;
    }

    // Convertir l'ID du participant en chaîne pour comparaison fiable
    const participantIdStr = String(participantId);

    const isInList = userContacts.some((contact) => {
      if (!contact || !contact.contactId) {
        console.log("Structure de contact invalide:", contact);
        return false;
      }

      // contactId peut être un objet avec _id ou directement l'id
      const contactIdStr = String(
        contact.contactId._id || contact.contactId
      ).trim();
      const match = contactIdStr === participantIdStr;

      if (match) {
        console.log("Contact trouvé:", contactIdStr);
      }

      return match;
    });

    console.log("Résultat de la vérification:", isInList);
    return isInList;
  };

  // Fonction pour ajouter un contact
  const handleAddContact = async () => {
    if (!pendingContact) return;

    try {
      await addContact(userId, pendingContact._id);
      Alert.alert(t("common.success"), t("chat.contactAdded"));
      await loadContacts(); // Recharger la liste des contacts
      setNewContactModal(false);
      setPendingContact(null);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error.message || t("chat.addContactError")
      );
    }
  };

  // Fonction appelée après la suppression d'un contact
  const afterContactRemoval = () => {
    // Vider la liste des conversations vérifiées pour permettre une nouvelle détection
    console.log("Réinitialisation après suppression de contact");
    checkedConversationsRef.current.clear();
    // Recharger les contacts et les conversations
    loadContacts();
    loadConversations();
  };

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
      console.log("Conversations chargées:", fetchedConversations.length);

      // Vérifier si de nouvelles conversations sont apparues
      const hasNewConversations =
        fetchedConversations.length > conversations.length;
      if (hasNewConversations) {
        console.log(
          "Nouvelles conversations détectées! Réinitialisation des vérifications."
        );
        checkedConversationsRef.current.clear();
      }

      // Pour identifier de nouvelles conversations spécifiques
      const existingConversationIds = conversations.map((c) => c._id);
      const newConversations = fetchedConversations.filter(
        (conv) => !existingConversationIds.includes(conv._id)
      );

      if (newConversations.length > 0) {
        console.log(
          `${newConversations.length} nouvelles conversations identifiées`
        );
      }

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

      // Si de nouvelles conversations ont été détectées, vérifier tout de suite s'il y a des étrangers
      if (hasNewConversations && userContacts && userContacts.length > 0) {
        console.log(
          "Vérification immédiate des étrangers suite à de nouvelles conversations"
        );
        setTimeout(() => {
          checkNewConversationsWithStrangers(sortedConversations);
        }, 100);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("chat.loadError"));
    } finally {
      setLoading(false);
    }
  };

  // Vérifier s'il y a de nouvelles conversations avec des personnes qui ne sont pas dans les contacts
  const checkNewConversationsWithStrangers = (convs) => {
    console.log("Vérification des nouvelles conversations...");
    console.log("Nombre de conversations:", convs.length);
    console.log("Nombre de contacts:", userContacts.length);

    // Si aucun contact n'est chargé, ne pas continuer
    if (!userContacts || !convs || !convs.length) {
      console.log(
        "Aucun contact ou conversation chargé, abandon de la vérification"
      );
      return;
    }

    // Pour débogage seulement: permettre de forcer la vérification en décommentant
    // checkedConversationsRef.current.clear();

    console.log("Conversations déjà vérifiées:", [
      ...checkedConversationsRef.current,
    ]);

    // 1. Créer un dictionnaire des IDs de contacts
    const contactIds = new Set();
    userContacts.forEach((contact) => {
      const contactId =
        contact.contactId && (contact.contactId._id || contact.contactId);
      if (contactId) {
        contactIds.add(String(contactId));
      }
    });

    console.log("Nombre d'IDs de contacts:", contactIds.size);

    // 2. Trouver toutes les conversations avec des non-contacts
    const strangerConvs = convs.filter((conv) => {
      // S'assurer que la conversation est valide
      if (!conv || !conv._id || !conv.participants) {
        console.log("Structure de conversation invalide:", conv);
        return false;
      }

      // Vérifier que la conversation a été traitée
      if (checkedConversationsRef.current.has(conv._id)) {
        console.log("Conversation déjà vérifiée:", conv._id);
        return false;
      }

      // Marquer comme vérifiée pour éviter de la ré-examiner
      checkedConversationsRef.current.add(conv._id);

      // Trouver l'autre participant (qui n'est pas l'utilisateur actuel)
      const otherParticipant = conv.participants.find(
        (p) => String(p._id) !== String(userId)
      );

      if (!otherParticipant) {
        console.log("Participant non trouvé dans la conversation", conv._id);
        return false;
      }

      console.log(
        "Autre participant trouvé:",
        otherParticipant.firstName,
        otherParticipant.lastName,
        "ID:",
        otherParticipant._id
      );

      // Vérification plus rapide avec le Set d'IDs de contacts
      const participantIdStr = String(otherParticipant._id);
      const isInContacts = contactIds.has(participantIdStr);

      console.log("Est dans les contacts?", isInContacts);

      return !isInContacts;
    });

    console.log("Conversations avec étrangers trouvées:", strangerConvs.length);

    if (strangerConvs.length > 0) {
      console.log(
        "Détails des conversations avec étrangers:",
        strangerConvs.map((conv) => {
          const other = conv.participants.find(
            (p) => String(p._id) !== String(userId)
          );
          return {
            convId: conv._id,
            contact: other ? `${other.firstName} ${other.lastName}` : "Inconnu",
          };
        })
      );
    }

    // S'il y a des conversations avec des étrangers, afficher la modale
    if (strangerConvs.length > 0) {
      // Prendre la plus récente
      const firstStrangerConv = strangerConvs[0];
      const stranger = firstStrangerConv.participants.find(
        (p) => String(p._id) !== String(userId)
      );

      if (stranger) {
        console.log(
          "Affichage de la modale pour:",
          stranger.firstName,
          stranger.lastName
        );

        // Si la modale n'est pas déjà ouverte
        if (!newContactModal) {
          setPendingContact(stranger);
          // Utiliser setTimeout pour éviter les conflits d'état React
          setTimeout(() => {
            console.log("Définition du state newContactModal à true");
            setNewContactModal(true);
          }, 100);
        }
      }
    }
  };

  // Surveillance spécifique du changement de contacts
  useEffect(() => {
    // Si la liste des contacts change (ajout ou suppression)
    console.log("Liste de contacts mise à jour:", userContacts?.length || 0);

    // Si on vient de supprimer un contact (la liste a diminué)
    if (previousUserContactsCountRef.current > (userContacts?.length || 0)) {
      console.log("Détection d'une suppression de contact");
      // Réinitialiser pour permettre de vérifier à nouveau toutes les conversations
      checkedConversationsRef.current.clear();
      // Forcer une nouvelle vérification
      if (conversations.length > 0) {
        setTimeout(() => {
          checkNewConversationsWithStrangers(conversations);
        }, 500);
      }
    }

    // Mettre à jour notre référence
    previousUserContactsCountRef.current = userContacts?.length || 0;
  }, [userContacts]);

  // Forcer la vérification quand les conversations ou contacts changent
  useEffect(() => {
    const checkConversations = async () => {
      if (userContacts && conversations.length > 0 && !loading) {
        console.log("Vérification forcée des nouvelles conversations");

        // Réinitialiser complètement les conversations vérifiées lors de la première charge
        // ou d'un changement important du nombre de conversations ou contacts
        if (
          checkedConversationsRef.current.size === 0 ||
          conversations.length > previousConversationsRef.current.length ||
          (userContacts.length > 0 &&
            previousUserContactsCountRef.current === 0)
        ) {
          console.log(
            "Réinitialisation des conversations vérifiées - changement détecté"
          );
          checkedConversationsRef.current.clear();
        }

        checkNewConversationsWithStrangers(conversations);
      }
    };

    checkConversations();

    // Référence pour suivre les changements
    previousUserContactsCountRef.current = userContacts
      ? userContacts.length
      : 0;
  }, [userContacts, conversations, loading]);

  // Vérification régulière avec un timer distinct pour éviter les conflits
  useEffect(() => {
    const checkTimer = setInterval(() => {
      if (
        userContacts &&
        userContacts.length > 0 &&
        conversations.length > 0 &&
        !newContactModal &&
        !loading
      ) {
        // Force une vérification complète toutes les 60 secondes
        const now = new Date();
        if (now.getSeconds() < 5) {
          console.log("Réinitialisation planifiée des conversations vérifiées");
          checkedConversationsRef.current.clear();
        }

        checkNewConversationsWithStrangers(conversations);
      }
    }, 5000); // Vérifier toutes les 5 secondes

    return () => clearInterval(checkTimer);
  }, [userContacts, conversations, newContactModal, loading]);

  // Ajouter un effet spécifique pour la modale
  useEffect(() => {
    // Lorsque pendingContact change et qu'il y a un contact en attente,
    // s'assurer que la modale est ouverte
    if (pendingContact && !newContactModal) {
      console.log(
        "Contact en attente détecté mais modale fermée, ouverture forcée"
      );
      setNewContactModal(true);
    }
  }, [pendingContact, newContactModal]);

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
            // Réinitialiser les conversations vérifiées après suppression
            checkedConversationsRef.current.clear();
            // Recharger la liste des conversations
            loadConversations();
            // Notification simple de succès
            Alert.alert(t("common.success"), t("chat.deleteSuccess"));
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
            // Réinitialiser les conversations vérifiées avant la déconnexion
            checkedConversationsRef.current.clear();

            // Déconnexion
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

      {/* Modale pour ajouter un nouveau contact */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={newContactModal}
        onRequestClose={() => {
          setNewContactModal(false);
          setPendingContact(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("chat.newContactRequest")}</Text>

            {pendingContact && (
              <View style={styles.pendingContactInfo}>
                <Image
                  source={{
                    uri:
                      pendingContact.profileImage ||
                      "https://via.placeholder.com/80",
                  }}
                  style={styles.pendingContactImage}
                />
                <Text style={styles.pendingContactName}>
                  {pendingContact.firstName} {pendingContact.lastName}
                </Text>
                <Text style={styles.pendingContactPhone}>
                  {pendingContact.phone}
                </Text>
              </View>
            )}

            <Text style={styles.modalMessage}>
              {t("chat.contactRequestMessage")}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.declineButton]}
                onPress={() => {
                  setNewContactModal(false);
                  setPendingContact(null);
                }}
              >
                <Text style={styles.declineButtonText}>{t("common.no")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={handleAddContact}
              >
                <Text style={styles.acceptButtonText}>{t("common.yes")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#075E54",
    marginBottom: 15,
    textAlign: "center",
  },
  pendingContactInfo: {
    alignItems: "center",
    marginVertical: 15,
  },
  pendingContactImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#075E54",
  },
  pendingContactName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  pendingContactPhone: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    minWidth: "45%",
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: "#f2f2f2",
  },
  acceptButton: {
    backgroundColor: "#25D366",
  },
  declineButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default HomeScreen;
