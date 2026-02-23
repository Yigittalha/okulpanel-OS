import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import api from "../../lib/api";
import { getToken } from "../../lib/storage";
import { darkBlue, yellow } from "../../constants/colors";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";

const Login = () => {
  const navigation = useNavigation();
  const { schoolCode, schoolPhoto, setSession } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isDemo = schoolCode === "demo";

  // Şifremi unuttum sayfasına yönlendir
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPasswordType');
  };


  const handleLogin = async (overrideEmail, overridePassword) => {
    // onSubmitEditing handler'ından gelen synthetic event'i görmezden gel
    if (overrideEmail && typeof overrideEmail === 'object' && 'nativeEvent' in overrideEmail) {
      overrideEmail = undefined;
      overridePassword = undefined;
    }
    const useEmail = overrideEmail ?? email;
    const usePassword = overridePassword ?? password;
    if (!useEmail || !usePassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/user/login", {
        username: useEmail,
        password: usePassword,
      });

      // Check if response is false (wrong credentials)
      if (response.data === false) {
        Alert.alert("Giriş başarısız", "Kullanıcı adı veya şifre yanlış");
        return;
      }

      console.log("🔍 Login API response received");
      console.log("🔍 Response data:", response.data);

      const { token, rol } = response.data;

      if (token && rol) {
        // Map rol numbers to role names
        let role;
        switch (rol) {
          case "1":
            role = "admin";
            break;
          case "2":
            role = "teacher";
            break;
          case "3":
            role = "parent";
            break;
          default:
            role = "parent"; // Default fallback
        }

        // Only save token, role, schoolCode and schoolPhoto - let dashboards fetch user data
        await setSession({
          accessToken: token,
          role: role,
          schoolCode,
          schoolPhoto,
        });

        // FCM token'ı gönder
        if (global.sendFCMTokenAfterLogin) {
          global.sendFCMTokenAfterLogin({ role: role });
        }

        Alert.alert("Başarılı", "Giriş başarılı!");
      } else {
        Alert.alert("Hata", "Geçersiz yanıt formatı");
      }
    } catch (err) {
      console.error("❌ Login API error occurred");
      console.error("❌ Error type:", err.constructor.name);
      console.error("❌ Error message:", err.message);
      console.error("❌ Error code:", err.code);

      if (err.response) {
        console.error("❌ Response status:", err.response.status);
        console.error("❌ Response data:", err.response.data);
        console.error("❌ Response headers:", err.response.headers);
      } else if (err.request) {
        console.error("❌ Request was made but no response received");
        console.error("❌ Request:", err.request);
      } else {
        console.error("❌ Error setting up request");
      }

      if (err.response?.status === 400) {
        Alert.alert(
          "Giriş başarısız",
          "Bilgiler boş veya yanlış gönderilmiştir",
        );
      } else if (err.response?.data === false) {
        Alert.alert("Giriş başarısız", "Kullanıcı adı veya şifre yanlış");
      } else if (
        err.code === "ERR_NETWORK" ||
        err.message.includes("Network Error")
      ) {
        Alert.alert(
          "Bağlantı Hatası",
          "Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.",
        );
      } else {
        Alert.alert(
          "Giriş başarısız",
          err.response?.data?.message || "Bilinmeyen hata",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.logoContainer}>
          {/* Seçilen okulun fotoğrafı */}
          {schoolPhoto && (
            <View style={styles.schoolPhotoContainer}>
              <Image
                source={{ uri: schoolPhoto }}
                style={styles.schoolPhoto}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Giriş Yap</Text>

          {schoolCode && (
            <View
              style={[styles.schoolBadge, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.schoolInfo, { color: theme.primary }]}>
                📚 {schoolCode}
              </Text>
            </View>
          )}

          {!isDemo && (
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Kullanıcı Adı
            </Text>
            <TextInput
              placeholder="Kullanıcı adını giriniz"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                { backgroundColor: theme.input, color: theme.inputText },
              ]}
              placeholderTextColor="#999"
              returnKeyType="next"
            />
          </View>
          )}

          {!isDemo && (
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Şifre
            </Text>
            <TextInput
              placeholder="Şifrenizi girin"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[
                styles.input,
                { backgroundColor: theme.input, color: theme.inputText },
              ]}
              placeholderTextColor="#999"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>
          )}

          {!isDemo && (
          <TouchableOpacity
            style={[
              styles.button,
              { opacity: loading ? 0.6 : 1, backgroundColor: theme.accent },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: theme.primary }]}>
              {loading ? "🔄 Giriş yapılıyor..." : "🚀 Giriş Yap"}
            </Text>
          </TouchableOpacity>
          )}

          {!isDemo && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.textSecondary }]}>
                Şifremi Unuttum
              </Text>
            </TouchableOpacity>
          )}

          {isDemo && (
            ['Öğretmen','Öğrenci','Yönetici'].map((label) => (
              <TouchableOpacity
                key={label}
                style={[styles.button, { backgroundColor: theme.accent }]}
                onPress={() => {
                  if (loading) return;
                  const emailForRole = label === 'Öğrenci' ? 'student@test.com' : (label === 'Öğretmen' ? 'teacher@test.com' : 'admin@test.com');
                  handleLogin(emailForRole, '123456');
                }}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: theme.primary }]}>{label}</Text>
              </TouchableOpacity>
            ))
          )}

        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  themeToggle: {
    position: "absolute",
    top: 80,
    right: 20,
    zIndex: 1000,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  schoolPhotoContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  schoolPhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  schoolBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 25,
  },
  schoolInfo: {
    fontSize: 14,
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotPasswordButton: {
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 10,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});

export default Login;
