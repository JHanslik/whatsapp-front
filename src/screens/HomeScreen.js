import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { logoutUser } from '../services/api';

const HomeScreen = ({ route, navigation }) => {
  const userId = route.params?.userId;

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutUser();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert("Erreur", "Impossible de se déconnecter");
            }
          }
        }
      ]
    );
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
            onPress={() => navigation.navigate('Profile', { userId })}
            style={styles.profileButton}
          >
            <Image
              source={{ uri: 'https://via.placeholder.com/40' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bienvenue sur WhatsApp</Text>
          <Text style={styles.welcomeSubtitle}>
            Connectez-vous avec vos amis et votre famille
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Profile', { userId })}>
            <View style={[styles.actionIcon, { backgroundColor: '#075E54' }]}>
              <Text style={styles.actionIconText}>👤</Text>
            </View>
            <Text style={styles.actionText}>Profil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('AddContact', { userId: route.params?.userId })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#25D366' }]}>
              <Text style={styles.actionIconText}>💬</Text>
            </View>
            <Text style={styles.actionText}>Nouveau Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#128C7E' }]}>
              <Text style={styles.actionIconText}>👥</Text>
            </View>
            <Text style={styles.actionText}>Groupes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#34B7F1' }]}>
              <Text style={styles.actionIconText}>📞</Text>
            </View>
            <Text style={styles.actionText}>Appels</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Chats Section */}
        <View style={styles.recentChats}>
          <Text style={styles.sectionTitle}>Conversations récentes</Text>
          {/* Add your recent chats list here */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#128C7E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logoutButton: {
    padding: 5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#128C7E',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
  },
  recentChats: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
});

export default HomeScreen; 