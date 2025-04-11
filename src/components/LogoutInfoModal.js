import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const LogoutInfoModal = () => {
  const { t } = useTranslation();
  const { showLogoutModal, closeLogoutModal, lastLogoutTime, logoutDuration } =
    useAuth();

  // Formater la date et l'heure de déconnexion
  const formatLogoutTime = (isoString) => {
    if (!isoString) return "";

    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Les mois commencent à 0
    const year = date.getFullYear();

    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  };

  const formattedLogoutTime = formatLogoutTime(lastLogoutTime);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLogoutModal}
      onRequestClose={closeLogoutModal}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>{t("auth.welcomeBack")}</Text>

          <Text style={styles.logoutInfo}>
            {t("auth.lastLogout")} : {formattedLogoutTime}
          </Text>

          <Text style={styles.logoutInfo}>
            {t("auth.disconnectedFor")} : {logoutDuration}
          </Text>

          <TouchableOpacity style={styles.button} onPress={closeLogoutModal}>
            <Text style={styles.buttonText}>{t("common.ok")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#075E54",
  },
  logoutInfo: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#25D366",
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default LogoutInfoModal;
