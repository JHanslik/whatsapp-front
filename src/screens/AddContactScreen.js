import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  searchContact,
  addContact,
  getUserContacts,
  deleteContact,
  updateContactAlias,
  createConversation,
} from "../services/api";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const AddContactScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [contacts, setContacts] = useState([]);
  const userId = route.params?.userId;
  const [editingContact, setEditingContact] = useState(null);
  const [alias, setAlias] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newAlias, setNewAlias] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const userContacts = await getUserContacts(userId);
      setContacts(userContacts);
    } catch (error) {
      Alert.alert(t("common.error"), t("chat.loadError"));
    }
  };

  const handleSearch = async () => {
    if (!phone) {
      Alert.alert(t("common.error"), t("chat.phoneRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await searchContact(phone);
      setSearchResult(result);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error.message || t("chat.contactNotFound")
      );
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!searchResult) {
      Alert.alert(t("common.error"), t("chat.searchFirst"));
      return;
    }

    setLoading(true);
    try {
      await addContact(userId, searchResult._id);
      Alert.alert(t("common.success"), t("chat.contactAdded"));
      await loadContacts(); // Recharger la liste des contacts
      setSearchResult(null);
      setPhone("");
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error.message || t("chat.addContactError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await deleteContact(contactId);
      Alert.alert(t("common.success"), t("chat.contactDeleted"));
      loadContacts(); // Recharger la liste
    } catch (error) {
      Alert.alert(t("common.error"), error.message || t("chat.deleteError"));
    }
  };

  const handleUpdateAlias = async () => {
    try {
      await updateContactAlias(selectedContact._id, newAlias);
      Alert.alert(t("common.success"), t("chat.aliasUpdated"));
      setIsModalVisible(false);
      setSelectedContact(null);
      setNewAlias("");
      loadContacts(); // Recharger la liste
    } catch (error) {
      Alert.alert(t("common.error"), error.message || t("chat.updateError"));
    }
  };

  const openEditModal = (contact) => {
    setSelectedContact(contact);
    setNewAlias(contact.alias || "");
    setIsModalVisible(true);
  };

  const handleOpenConversation = async (contact) => {
    try {
      // Créer ou récupérer une conversation existante
      const participants = [userId, contact.contactId._id];
      const conversation = await createConversation(participants);

      // Naviguer vers l'écran de conversation
      navigation.navigate("Conversation", {
        conversationId: conversation._id,
        contactName:
          contact.alias ||
          `${contact.contactId.firstName} ${contact.contactId.lastName}`,
        userId: userId,
      });
    } catch (error) {
      Alert.alert(t("common.error"), t("chat.openConversationError"));
    }
  };

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        {item.alias && <Text style={styles.aliasText}>{item.alias}</Text>}
        <Text style={styles.contactName}>
          {item.contactId.firstName} {item.contactId.lastName}
        </Text>
        <Text style={styles.contactPhone}>{item.contactId.phone}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleOpenConversation(item)}
        >
          <Icon name="message-text" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Icon name="pencil" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteContact(item._id)}
        >
          <Icon name="delete" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <SafeAreaView style={styles.innerContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>{t("chat.newMessage")}</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder={t("profile.phone")}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>
                  {t("common.search")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {searchResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>{t("chat.contactFound")}</Text>
              <View style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {searchResult.firstName} {searchResult.lastName}
                  </Text>
                  <Text style={styles.contactPhone}>{searchResult.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddContact}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.addButtonText}>{t("common.add")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>{t("chat.myContacts")}</Text>
          <FlatList
            data={contacts}
            renderItem={renderContactItem}
            keyExtractor={(item) => item._id}
            style={styles.contactsList}
          />
        </View>

        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t("chat.editAlias")}</Text>

              <View style={styles.modalContactInfo}>
                <Text style={styles.modalContactName}>
                  {selectedContact?.contactId.firstName}{" "}
                  {selectedContact?.contactId.lastName}
                </Text>
                <Text style={styles.modalContactPhone}>
                  {selectedContact?.contactId.phone}
                </Text>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder={t("chat.aliasPlaceholder")}
                value={newAlias}
                onChangeText={setNewAlias}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleUpdateAlias}
                >
                  <Text style={styles.modalSaveButtonText}>
                    {t("common.save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  innerContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#075E54",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    borderColor: "#E0E0E0",
    borderWidth: 1,
  },
  searchButton: {
    backgroundColor: "#075E54",
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  resultContainer: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#075E54",
    marginBottom: 10,
  },
  contactCard: {
    padding: 15,
    backgroundColor: "#F0F2F5",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#075E54",
    marginTop: 20,
    marginBottom: 10,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aliasText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#075E54",
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#075E54",
    padding: 8,
    borderRadius: 5,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#DC3545",
    padding: 8,
    borderRadius: 5,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#25D366",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#075E54",
    marginBottom: 20,
    textAlign: "center",
  },
  modalContactInfo: {
    backgroundColor: "#F0F2F5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalContactName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  modalContactPhone: {
    fontSize: 14,
    color: "#666",
  },
  modalInput: {
    backgroundColor: "#F0F2F5",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalCancelButton: {
    backgroundColor: "#6C757D",
  },
  modalSaveButton: {
    backgroundColor: "#075E54",
  },
  modalCancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  chatButton: {
    backgroundColor: "#25D366",
    padding: 8,
    borderRadius: 5,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
});

export default AddContactScreen;
