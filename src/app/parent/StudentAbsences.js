import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
// ThemeToggle sadece ParentDashboard'da gösterilecek
import RefreshableScrollView from "../../components/RefreshableScrollView";
import StudentBottomMenu from "../../components/StudentBottomMenu";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const StudentAbsences = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentInfo: passedStudentInfo } = route.params || {};
  const { clearSession } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();
  const { openMenu } = useSlideMenu();
  const insets = useSafeAreaInsets();
  const [absencesList, setAbsencesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState(passedStudentInfo);

  // Fetch data only once on mount
  useEffect(() => {
    fetchStudentAbsences();
  }, []);

  const fetchStudentAbsences = async () => {
    try {
      setLoading(true);
      setError(null);

      // Önce geçirilen öğrenci bilgilerini kontrol et
      if (passedStudentInfo && passedStudentInfo.OgrenciId) {
        setStudentInfo(passedStudentInfo);

        // Devamsızlık listesini al
        const absencesResponse = await api.post("/student/attendance", {
          OgrenciID: passedStudentInfo.OgrenciId,
        });

        if (absencesResponse?.data) {
          // Devamsızlıkları tarihe göre sırala (en yeni üstte)
          const sortedAbsences = absencesResponse.data.sort((a, b) => {
            const dateA = new Date(a.tarih);
            const dateB = new Date(b.tarih);
            return dateB - dateA; // En yeni tarih üstte
          });

          setAbsencesList(sortedAbsences);
        } else {
          setAbsencesList([]);
        }
        return;
      }

      // Kullanıcı bilgilerini al (OgrenciId dahil)
      const userResponse = await api.post("/user/info", {});

      if (userResponse?.data) {
        if (userResponse.data.OgrenciId) {
          setStudentInfo(userResponse.data);

          // Devamsızlık listesini al
          const absencesResponse = await api.post("/student/attendance", {
            OgrenciID: userResponse.data.OgrenciId,
          });

          if (absencesResponse?.data) {
            // Devamsızlıkları tarihe göre sırala (en yeni üstte)
            const sortedAbsences = absencesResponse.data.sort((a, b) => {
              const dateA = new Date(a.tarih);
              const dateB = new Date(b.tarih);
              return dateB - dateA; // En yeni tarih üstte
            });

            setAbsencesList(sortedAbsences);
          } else {
            setAbsencesList([]);
          }
        } else {
          setError("Öğrenci ID bilgisi bulunamadı. Lütfen tekrar giriş yapın.");

          // Oturumu sonlandır
          setTimeout(() => {
            clearSession();
          }, 2000);
        }
      } else {
        setError("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");

        // Oturumu sonlandır
        setTimeout(() => {
          clearSession();
        }, 2000);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        navigation.navigate("Login");
      } else {
        setError(
          "Devamsızlık listesi alınırken bir hata oluştu: " + error.message,
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudentAbsences();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "Devamsız";
      case 1:
        return "Mevcut";
      case 2:
        return "Geç Geldi";
      default:
        return "Bilinmiyor";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return theme.danger; // Devamsız - kırmızı
      case 1:
        return theme.success; // Mevcut - yeşil
      case 2:
        return theme.warning; // Geç geldi - turuncu
      default:
        return theme.muted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 0:
        return "❌";
      case 1:
        return "✅";
      case 2:
        return "⏰";
      default:
        return "❓";
    }
  };

  const isRecentAbsence = (dateString) => {
    if (!dateString) return false;
    const absenceDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - absenceDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Son 7 gün içinde
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <FeaturePageHeader
          title="Devamsızlık Geçmişi"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Devamsızlık bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <FeaturePageHeader
        title="Devamsızlık Geçmişi"
        onBackPress={() => navigation.goBack()}
      />

      <RefreshableScrollView
        onRefresh={handleRefresh}
        refreshing={refreshing}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
      >
        {error ? (
          <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.errorText, { color: theme.danger }]}>
              ❌ {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                {
                  backgroundColor: isDark ? theme.accent : "#007AFF", // iOS mavi tonu
                  opacity: 0.9,
                },
              ]}
              onPress={fetchStudentAbsences}
            >
              <Text style={[styles.retryButtonText, { color: "#fff" }]}>
                Tekrar Dene
              </Text>
            </TouchableOpacity>
          </View>
        ) : absencesList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              📚 Henüz devamsızlık kaydı bulunmuyor
            </Text>
          </View>
        ) : (
          absencesList.map((absence, index) => (
            <View
              key={absence.tarih + index}
              style={[
                styles.absenceCard,
                {
                  backgroundColor: theme.card,
                  borderLeftWidth: isRecentAbsence(absence.tarih) ? 4 : 0,
                  borderLeftColor: isRecentAbsence(absence.tarih)
                    ? theme.warning
                    : "transparent",
                },
              ]}
            >
              <View style={styles.absenceHeader}>
                <View style={styles.dateContainer}>
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    📅 {formatDate(absence.tarih)}
                  </Text>
                  <Text
                    style={[styles.dayText, { color: "#9CA3AF" }]}
                  >
                    {absence.Gun}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(absence.durum) },
                    ]}
                  >
                    {getStatusIcon(absence.durum)}{" "}
                    {getStatusText(absence.durum)}
                  </Text>
                </View>
              </View>

              <View style={styles.absenceDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: "#9CA3AF" }]}>
                    📖 Ders:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {absence.Ders}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: "#9CA3AF" }]}>
                    🕐 Saat:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {absence.DersSaati}
                  </Text>
                </View>
              </View>

              {isRecentAbsence(absence.tarih) && (
                <View
                  style={[
                    styles.recentBadge,
                    { backgroundColor: theme.warning + "20" },
                  ]}
                >
                  <Text style={[styles.recentText, { color: "#9CA3AF" }]}>
                    ⏰ Son 7 gün içinde
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </RefreshableScrollView>
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentAbsences" 
      />
    </View>
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
  menuButton: {
    padding: 10,
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 44, // ThemeToggle yerine boş alan
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  absenceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    // Gölge kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  absenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  dateContainer: {
    flex: 1,
    paddingRight: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 24,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.8,
    lineHeight: 20,
  },
  statusContainer: {
    alignItems: "flex-end",
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: 'center',
  },
  absenceDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  recentBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  recentText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
});

export default StudentAbsences;
