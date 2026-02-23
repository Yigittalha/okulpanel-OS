import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api, { getUploadUrl, fetchUserInfo } from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RefreshableScrollView from "../../components/RefreshableScrollView";
import packageJson from '../../../package.json';

const ParentProfile = () => {
  const navigation = useNavigation();
  const { schoolCode, clearSession } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();
  const { openMenu } = useSlideMenu();
  const insets = useSafeAreaInsets();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudentData = async () => {
    try {
      const data = await fetchUserInfo(true);

      if (data) {
        setStudentData(data);
        setError(null);
        
        if (global.sendFCMTokenAfterLogin) {
          console.log('🔥 Öğrenci girişi başarılı, FCM token gönderiliyor...');
          global.sendFCMTokenAfterLogin(data);
        }
      } else {
        setError("Öğrenci bilgileri alınamadı. Lütfen tekrar giriş yapın.");
        setTimeout(() => {
          clearSession();
        }, 2000);
      }
    } catch (error) {
      setError("Sistem hatası oluştu. Lütfen tekrar giriş yapın.");
      setTimeout(() => {
        clearSession();
      }, 2000);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const REMOTE_VERSION_URL = 'https://www.okulpanel.com.tr/api/center/v1/get/version';
          const res = await fetch(REMOTE_VERSION_URL, { method: 'POST' });
          const responseJson = await res.json();
          const remoteVersion = responseJson.ios;
          const appVersion = packageJson.version;
          const APPSTORE_URL = 'https://apps.apple.com/tr/app/okul-panel/id6752626710?l=tr';
          if (remoteVersion && remoteVersion.trim() !== appVersion.trim()) {
            Alert.alert(
              'YENİ SÜRÜM MEVCUT',
              `Uygulama versiyonunuz: ${appVersion} \nGüncel versiyon: ${remoteVersion}`,
              [
                { text: 'Tamam' },
                {
                  text: 'Güncelle',
                  onPress: () => Linking.openURL(APPSTORE_URL),
                  style: 'default',
                },
              ]
            );
          }
        } catch (error) {/* hata durumunda sessizce geç */}
      })();
    }, []));

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudentData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const getGenderText = (gender) => {
    return gender === true || gender === "1" ? "Erkek" : "Kadın";
  };

  const getUserPhotoUrl = () => {
    try {
      if (!studentData) {
        return null;
      }

      if (!studentData?.Fotograf) {
        return null;
      }

      if (typeof studentData.Fotograf === "string") {
        return getUploadUrl(studentData.Fotograf, schoolCode);
      }

      return null;
    } catch (error) {
      console.log("❌ Fotoğraf URL oluşturma hatası:", error);
      return null;
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Veriler yükleniyor...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Öğrenci bilgileri bulunamadı
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.accent }]}
          onPress={fetchStudentData}
        >
          <Text style={[styles.retryText, { color: theme.primary }]}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          borderBottomColor: theme.border,
          paddingTop: Math.max(insets.top + 10, 44),
        }
      ]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>

      <RefreshableScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Modern Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={styles.avatarBackground}>
            <View style={styles.avatarContainer}>
              {getUserPhotoUrl() ? (
                <Image
                  source={{ uri: getUserPhotoUrl() }}
                  style={styles.userPhoto}
                  defaultSource={require("../../../assets/icon.png")}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                  <Text style={styles.avatarText}>👨‍🎓</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.text }]}>
              {studentData?.AdSoyad}
            </Text>
            <Text style={[styles.department, { color: theme.textSecondary }]}>
              {studentData?.Sinif} Sınıfı
            </Text>
            <Text style={[styles.teacherId, { color: theme.muted }]}>
              Öğrenci No: {studentData?.OgrenciNumara}
            </Text>
          </View>

          {schoolCode && (
            <View style={[styles.schoolBadge, { backgroundColor: theme.accent }]}>
              <Text style={[styles.schoolText, { color: theme.primary }]}>
                🏫 {schoolCode}
              </Text>
            </View>
          )}
        </View>

        {/* Modern Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleLine} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              👤 Kişisel Bilgiler
            </Text>
            <View style={styles.cardTitleLine} />
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
              <Text style={[styles.infoIcon, { color: theme.accent }]}>📧</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  E-posta
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {studentData?.Eposta}
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
              <Text style={[styles.infoIcon, { color: theme.accent }]}>📱</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Telefon
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {studentData?.Telefon}
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
              <Text style={[styles.infoIcon, { color: theme.accent }]}>🆔</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  TC Kimlik
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {studentData?.TCKimlikNo}
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
              <Text style={[styles.infoIcon, { color: theme.accent }]}>👤</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Cinsiyet
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {getGenderText(studentData?.Cinsiyet)}
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
              <Text style={[styles.infoIcon, { color: theme.accent }]}>🎂</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Doğum Tarihi
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {formatDate(studentData?.DogumTarihi)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate("PasswordChange")}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonIcon, { color: theme.primary }]}>🔐</Text>
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              Şifreyi Değiştir
            </Text>
          </TouchableOpacity>
        </View>

      </RefreshableScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  userPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FFD60A",
  },
  avatarText: {
    fontSize: 36,
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: 'center',
  },
  department: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: 'center',
  },
  teacherId: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 12,
    textAlign: 'center',
  },
  schoolBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  schoolText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 16,
    textAlign: 'center',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    padding: 20,
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ParentProfile;
