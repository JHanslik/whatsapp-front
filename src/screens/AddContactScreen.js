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
import {
  searchContact,
  addContact,
  getUserContacts,
  deleteContact,
  updateContactAlias,
} from "../services/api";

const AddContactScreen = ({ navigation, route }) => {
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
      console.error("Erreur lors du chargement des contacts:", error);
    }
  };

  const handleSearch = async () => {
    if (!phone) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de téléphone");
      return;
    }

    setLoading(true);
    try {
      const result = await searchContact(phone);
      setSearchResult(result);
    } catch (error) {
      Alert.alert("Erreur", error.message || "Contact non trouvé");
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!searchResult) {
      Alert.alert("Erreur", "Veuillez d'abord rechercher un contact");
      return;
    }

    setLoading(true);
    try {
      await addContact(userId, searchResult._id);
      Alert.alert("Succès", "Contact ajouté avec succès");
      await loadContacts(); // Recharger la liste des contacts
      setSearchResult(null);
      setPhone("");
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.message || "Erreur lors de l'ajout du contact"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await deleteContact(contactId);
      Alert.alert("Succès", "Contact supprimé avec succès");
      loadContacts(); // Recharger la liste
    } catch (error) {
      Alert.alert("Erreur", error.message || "Erreur lors de la suppression");
    }
  };

  const handleUpdateAlias = async () => {
    try {
      await updateContactAlias(selectedContact._id, newAlias);
      Alert.alert("Succès", "Alias mis à jour avec succès");
      setIsModalVisible(false);
      setSelectedContact(null);
      setNewAlias("");
      loadContacts(); // Recharger la liste
    } catch (error) {
      Alert.alert("Erreur", error.message || "Erreur lors de la mise à jour");
    }
  };

  const openEditModal = (contact) => {
    setSelectedContact(contact);
    setNewAlias(contact.alias || "");
    setIsModalVisible(true);
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
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.buttonText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteContact(item._id)}
        >
          <Text style={styles.buttonText}>Supprimer</Text>
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
          <Text style={styles.title}>Ajouter un contact</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
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
                <Text style={styles.searchButtonText}>Rechercher</Text>
              )}
            </TouchableOpacity>
          </View>

          {searchResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Contact trouvé :</Text>
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
                    <Text style={styles.addButtonText}>Ajouter</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Mes contacts</Text>
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
              <Text style={styles.modalTitle}>Modifier l'alias</Text>

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
                placeholder="Nouvel alias"
                value={newAlias}
                onChangeText={setNewAlias}
                autoFocus={true}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setIsModalVisible(false);
                    setSelectedContact(null);
                    setNewAlias("");
                  }}
                >
                  <Text style={styles.modalButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={handleUpdateAlias}
                >
                  <Text style={styles.modalButtonText}>Enregistrer</Text>
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
    minWidth: 70,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#DC3545",
    padding: 8,
    borderRadius: 5,
    minWidth: 70,
    alignItems: "center",
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
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#6C757D",
  },
  modalSaveButton: {
    backgroundColor: "#075E54",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddContactScreen;
