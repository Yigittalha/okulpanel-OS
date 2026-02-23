import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import api, { updatePassword } from "../../lib/api";

const PasswordChangeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useContext(SessionContext);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Şifre en az 6 karakter olmalıdır";
    }
    return null;
  };

  const handlePasswordChange = async () => {
    // Validasyonlar
    if (!newPassword.trim()) {
      Alert.alert("Hata", "Yeni şifrenizi giriniz");
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert("Hata", "Yeni şifrenizi tekrar giriniz");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert("Hata", passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor");
      return;
    }

    setLoading(true);

    try {
      const response = await updatePassword(newPassword);

      Alert.alert(
        "Başarılı",
        "Şifreniz başarıyla değiştirildi",
        [
          {
            text: "Tamam",
            onPress: () => {
              // Formu temizle
              setNewPassword("");
              setConfirmPassword("");
              // Geri dön
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Şifre değiştirme hatası:", error);
      
      let errorMessage = "Şifre değiştirilirken bir hata oluştu";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = "Geçersiz şifre formatı";
      }

      Alert.alert("Hata", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
            paddingTop: Math.max(insets.top + 10, 35),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Şifre Değiştir
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            🔐 Güvenlik Ayarları
          </Text>

          <Text style={[styles.description, { color: theme.text }]}>
            Yeni şifrenizi güvenli tutmak için düzenli olarak değiştirmenizi öneririz.
          </Text>

          {/* Yeni Şifre */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Yeni Şifre
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Yeni şifrenizi giriniz"
                placeholderTextColor={theme.text + "80"}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.text + "80"}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.helpText, { color: theme.text + "80" }]}>
              En az 6 karakter olmalıdır
            </Text>
          </View>

          {/* Şifre Tekrar */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Yeni Şifre Tekrar
            </Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Yeni şifrenizi tekrar giriniz"
                placeholderTextColor={theme.text + "80"}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.text + "80"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Şifre Değiştir Butonu */}
          <TouchableOpacity
            style={[
              styles.changeButton,
              {
                backgroundColor: theme.accent,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handlePasswordChange}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color={theme.primary} />
                <Text style={[styles.changeButtonText, { color: theme.primary }]}>
                  Şifreyi Değiştir
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Güvenlik İpuçları */}
        <View style={[styles.tipsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.tipsTitle, { color: theme.text }]}>
            💡 Güvenlik İpuçları
          </Text>
          
          <View style={styles.tipItem}>
            <Text style={[styles.tipText, { color: theme.text }]}>
              • Güçlü bir şifre kullanın (harf, rakam ve özel karakter)
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Text style={[styles.tipText, { color: theme.text }]}>
              • Şifrenizi kimseyle paylaşmayın
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Text style={[styles.tipText, { color: theme.text }]}>
              • Düzenli olarak şifrenizi değiştirin
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 5,
  },
  helpText: {
    fontSize: 12,
    marginTop: 5,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  tipsCard: {
    borderRadius: 15,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default PasswordChangeScreen;
