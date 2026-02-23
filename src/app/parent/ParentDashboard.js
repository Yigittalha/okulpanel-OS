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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api, { getUploadUrl, fetchUserInfo } from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import RefreshableScrollView from "../../components/RefreshableScrollView";
import StudentBottomMenu from "../../components/StudentBottomMenu";

const ParentDashboard = () => {
  const navigation = useNavigation();
  const { schoolCode, clearSession } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();
  const { openMenu } = useSlideMenu();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data only once on mount
  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const data = await fetchUserInfo(true); // showErrors true olarak ayarlandı

      if (data) {
        // Use the user info directly
        setStudentData(data);
        setError(null); // Hata durumunu temizle
        
        // FCM token'ı backend'e gönder (login sonrası)
        if (global.sendFCMTokenAfterLogin) {
          console.log('🔥 Öğrenci girişi başarılı, FCM token gönderiliyor...');
          global.sendFCMTokenAfterLogin(data);
        }
      } else {
        setError("Öğrenci bilgileri alınamadı. Lütfen tekrar giriş yapın.");

        // Oturumu sonlandır
        setTimeout(() => {
          clearSession();
        }, 2000);
      }
    } catch (error) {
      console.error("Öğrenci bilgileri alınırken hata:", error);
      setError("Sistem hatası oluştu. Lütfen tekrar giriş yapın.");

      // Oturumu sonlandır
      setTimeout(() => {
        clearSession();
      }, 2000);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudentData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const getGenderText = (gender) => {
    return gender === true || gender === "1" ? "Erkek" : "Kız";
  };

  const getStudentPhotoUrl = () => {
    try {
      if (!studentData) {
        return null;
      }

      if (!studentData?.Fotograf) {
        return null;
      }

      // Fotoğraf string'i geldi mi kontrol et
      if (
        typeof studentData.Fotograf !== "string" ||
        studentData.Fotograf.trim() === ""
      ) {
        return null;
      }

      const photoUrl = getUploadUrl(studentData.Fotograf, schoolCode);

      // URL oluşturulduysa kullan, yoksa null döndür
      if (!photoUrl) {
        return null;
      }

      return photoUrl;
    } catch (error) {
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("ParentProfile")}
        >
          <Text style={[styles.profileIcon, { color: theme.text }]}>👤</Text>
        </TouchableOpacity>
      </View>

      <RefreshableScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 120 }} // Alt menü için daha fazla boşluk
      >
        {/* Modern Student Card */}
        <View style={[styles.studentCard, { backgroundColor: theme.card }]}>
          <View style={styles.avatarBackground}>
            <View style={styles.avatarContainer}>
              {(() => {
                const photoUrl = getStudentPhotoUrl();

                if (photoUrl) {
                  return (
                    <Image source={{ uri: photoUrl }} style={styles.userPhoto} />
                  );
                } else {
                  return (
                    <View
                      style={[styles.avatar, { backgroundColor: theme.accent }]}
                    >
                      <Text style={styles.avatarText}>
                        {getGenderText(studentData?.Cinsiyet) === "Erkek"
                          ? "👦"
                          : "👧"}
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.studentName, { color: theme.text }]}>
              {studentData?.AdSoyad}
            </Text>
            <Text style={[styles.classInfo, { color: theme.textSecondary }]}>
              📚 {studentData?.Sinif} Sınıfı
            </Text>
            <Text style={[styles.studentNumber, { color: theme.muted }]}>
              Öğrenci No: {studentData?.OgrenciNumara}
            </Text>
          </View>

          {schoolCode && (
            <View
              style={[styles.schoolBadge, { backgroundColor: theme.accent }]}
            >
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
              👤 Öğrenci Bilgileri
            </Text>
            <View style={styles.cardTitleLine} />
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
              <Text style={[styles.infoIcon, { color: theme.accent }]}>🆔</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  TC Kimlik
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {studentData?.TCKimlikNo ? studentData.TCKimlikNo.substring(0, 4) + '*******' : ''}
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

        {/* Modern Family Card */}
        <View style={[styles.familyCard, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleLine} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              👨‍👩‍👧‍👦 Aile Bilgileri
            </Text>
            <View style={styles.cardTitleLine} />
          </View>

          {/* Anne Bilgileri */}
          <View style={[styles.parentSection, { backgroundColor: theme.background }]}>
            <View style={styles.parentInfoGrid}>
              <View style={[styles.parentInfoItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.parentInfoIcon, { color: theme.accent }]}>📝</Text>
                <View style={styles.parentInfoContent}>
                  <Text style={[styles.parentInfoLabel, { color: theme.textSecondary }]}>
                    Ad Soyad
                  </Text>
                  <Text style={[styles.parentInfoValue, { color: theme.text }]}>
                    {studentData?.AnneAdSoyad}
                  </Text>
                </View>
              </View>

              <View style={[styles.parentInfoItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.parentInfoIcon, { color: theme.accent }]}>🎓</Text>
                <View style={styles.parentInfoContent}>
                  <Text style={[styles.parentInfoLabel, { color: theme.textSecondary }]}>
                    Eğitim
                  </Text>
                  <Text style={[styles.parentInfoValue, { color: theme.text }]}>
                    {studentData?.AnneEgitim}
                  </Text>
                </View>
              </View>

              <View style={[styles.parentInfoItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.parentInfoIcon, { color: theme.accent }]}>💼</Text>
                <View style={styles.parentInfoContent}>
                  <Text style={[styles.parentInfoLabel, { color: theme.textSecondary }]}>
                    Meslek
                  </Text>
                  <Text style={[styles.parentInfoValue, { color: theme.text }]}>
                    {studentData?.AnneMeslek}
                  </Text>
                </View>
              </View>

              <View style={[styles.parentInfoItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.parentInfoIcon, { color: theme.accent }]}>📱</Text>
                <View style={styles.parentInfoContent}>
                  <Text style={[styles.parentInfoLabel, { color: theme.textSecondary }]}>
                    Telefon
                  </Text>
                  <Text style={[styles.parentInfoValue, { color: theme.text }]}>
                    {studentData?.AnneTel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Baba Bilgileri */}
          <View style={[styles.parentSection, { backgroundColor: theme.background }]}>
            <View style={styles.parentInfoGrid}>
              <View style={[styles.parentInfoItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.parentInfoIcon, { color: theme.accent }]}>📝</Text>
                <View style={styles.parentInfoContent}>
                  <Text style={[styles.parentInfoLabel, { color: theme.textSecondary }]}>
                    Ad Soyad
                  </Text>
                  <Text style={[styles.parentInfoValue, { color: theme.text }]}>
                    {studentData?.BabaAdSoyad}
                  </Text>
                </View>
              </View>

              <View style={[styles.parentInfoItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.parentInfoIcon, { color: theme.accent }]}>🎓</Text>
                <View style={styles.parentInfoContent}>
                  <Text style={[styles.parentInfoLabel, { color: theme.textSecondary }]}>
                    Eğitim
                  </Text>
                  <Text style={[styles.parentInfoValue, { color: theme.text }]}>
                    {studentData?.BabaEgitim}
                  </Text>
                </View>
              </View>

              <View style={[styles.parentInfoItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.parentInfoIcon, { color: theme.accent }]}>💼</Text>
                <View style={styles.parentInfoContent}>
                  <Text style={[styles.parentInfoLabel, { color: theme.textSecondary }]}>
                    Meslek
                  </Text>
                  <Text style={[styles.parentInfoValue, { color: theme.text }]}>
                    {studentData?.BabaMeslek}
                  </Text>
                </View>
              </View>

              <View style={[styles.parentInfoItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.parentInfoIcon, { color: theme.accent }]}>📱</Text>
                <View style={styles.parentInfoContent}>
                  <Text style={[styles.parentInfoLabel, { color: theme.textSecondary }]}>
                    Telefon
                  </Text>
                  <Text style={[styles.parentInfoValue, { color: theme.text }]}>
                    {studentData?.BabaTel}
                  </Text>
                </View>
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
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="ParentDashboard" 
      />
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
    paddingTop: Platform.OS === 'ios' ? 44 : 40, // Improved safe area padding
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
    width: 48,
  },
  profileButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  profileIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  studentCard: {
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
  studentName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: 'center',
  },
  classInfo: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: 'center',
  },
  studentNumber: {
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
  familyCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  healthCard: {
    backgroundColor: "rgba(255, 100, 100, 0.1)",
    borderWidth: 1,
    borderColor: "#ff6b6b",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
  parentSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  parentTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: 'center',
  },
  parentInfoGrid: {
    gap: 12,
  },
  parentInfoItem: {
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
  parentInfoIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  parentInfoContent: {
    flex: 1,
  },
  parentInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: '#666',
  },
  parentInfoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
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

export default ParentDashboard;
