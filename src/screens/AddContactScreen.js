import React, { useState } from 'react';
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
} from 'react-native';
import { searchContact, addContact } from '../services/api';

const AddContactScreen = ({ navigation, route }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const userId = route.params?.userId;

  const handleSearch = async () => {
    if (!phone) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone');
      return;
    }

    setLoading(true);
    try {
      const result = await searchContact(phone);
      setSearchResult(result);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Contact non trouvé');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!searchResult) {
      Alert.alert('Erreur', 'Veuillez d\'abord rechercher un contact');
      return;
    }

    setLoading(true);
    try {
      await addContact(userId, searchResult._id);
      Alert.alert('Succès', 'Contact ajouté avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'ajout du contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
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
                <Text style={styles.contactName}>
                  {searchResult.firstName} {searchResult.lastName}
                </Text>
                <Text style={styles.contactPhone}>{searchResult.phone}</Text>
              </View>
            </View>
          )}

          <Text style={styles.info}>
            Recherchez d'abord le contact avant de l'ajouter
          </Text>
        </View>

        {searchResult && (
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddContact}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>Ajouter le contact</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#075E54',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  searchButton: {
    backgroundColor: '#075E54',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 10,
  },
  contactCard: {
    padding: 10,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  info: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  buttonWrapper: {
    width: '100%',
    padding: 20,
  },
  addButton: {
    backgroundColor: '#25D366',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddContactScreen;
