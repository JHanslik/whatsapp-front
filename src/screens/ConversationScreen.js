import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import { createMessage, getConversationMessages } from "../services/api";

const ConversationScreen = ({ route, navigation }) => {
  const { conversationId, contactName, userId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  const { height: windowHeight } = useWindowDimensions();
  const intervalRef = useRef(null);

  useEffect(() => {
    loadMessages();

    intervalRef.current = setInterval(() => {
      loadMessages();
    }, 1000);

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const fetchedMessages = await getConversationMessages(conversationId);
      if (JSON.stringify(fetchedMessages) !== JSON.stringify(messages)) {
        setMessages(fetchedMessages);
        flatListRef.current?.scrollToEnd();
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Créer d'abord le message localement pour l'affichage immédiat
      const localMessage = {
        _id: Date.now(), // ID temporaire
        senderId: userId, // Important: s'assurer que c'est une string
        text: newMessage.trim(),
        createdAt: new Date().toISOString(),
      };

      // Ajouter le message localement immédiatement
      setMessages((prevMessages) => [...prevMessages, localMessage]);
      setNewMessage("");
      flatListRef.current?.scrollToEnd();

      // Envoyer au serveur
      const serverMessage = await createMessage({
        conversationId,
        senderId: userId,
        text: newMessage.trim(),
      });

      // Optionnel: remplacer le message local par celui du serveur
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === localMessage._id ? serverMessage : msg
        )
      );
    } catch (error) {
      console.log("Erreur d'envoi:", error);
      Alert.alert("Erreur", "Impossible d'envoyer le message");
      // En cas d'erreur, retirer le message local
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== localMessage._id)
      );
    }
  };

  const renderMessage = ({ item }) => {
    const messageSenderId = item.senderId._id || item.senderId;
    const isOwnMessage = String(messageSenderId) === String(userId);

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#075E54" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        inverted={false}
        contentContainerStyle={[
          styles.messagesContainer,
          { paddingBottom: isKeyboardVisible ? keyboardHeight + 60 : 100 },
        ]}
      />

      <View
        style={[
          styles.inputContainer,
          {
            position: "absolute",
            bottom: isKeyboardVisible
              ? keyboardHeight + (Platform.OS === "android" ? 30 : 0)
              : Platform.OS === "android"
              ? 30
              : 0,
            left: 0,
            right: 0,
          },
        ]}
      >
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Écrivez un message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECE5DD",
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    marginVertical: 5,
    flexDirection: "row",
    width: "100%",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    elevation: 1,
  },
  ownMessage: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  ownBubble: {
    backgroundColor: "#DCF8C6",
    marginLeft: "auto",
    borderTopRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: "#FFFFFF",
    marginRight: "auto",
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
    color: "#000000",
  },
  messageTime: {
    fontSize: 12,
    color: "#7C7C7C",
    alignSelf: "flex-end",
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    paddingBottom: Platform.OS === "android" ? 10 : 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#075E54",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ConversationScreen;
