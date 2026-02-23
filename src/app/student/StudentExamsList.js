import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RefreshableScrollView from "../../components/RefreshableScrollView";
import StudentBottomMenu from "../../components/StudentBottomMenu";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const StudentExamsList = () => {
  const navigation = useNavigation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // API'den sınavları getir
  const fetchExams = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Önce kullanıcı bilgilerini al
      console.log("🔍 Fetching user info first...");
      const userResponse = await api.post("/user/info", {});
      
      if (!userResponse?.data) {
        Alert.alert("Hata", "Kullanıcı bilgileri alınamadı");
        return;
      }

      console.log("👤 User info received:", userResponse.data);
      setStudentInfo(userResponse.data);

      if (!userResponse.data.Sinif) {
        Alert.alert("Hata", "Sınıf bilgisi bulunamadı");
        return;
      }

      console.log("🔍 Fetching student exams for class:", userResponse.data.Sinif);
      console.log("🌐 API URL:", "/student/exam");
      console.log("📤 Request body:", { Sinif: userResponse.data.Sinif });

      const response = await api.post("/student/exam", {
        Sinif: userResponse.data.Sinif,
      });

      console.log("📡 API Response received:", response.status);
      console.log("📋 Response data:", response.data);

      const data = response?.data;

      if (data) {
        // Sınavları tarihe göre sırala (en yakın tarih en üstte)
        const sortedExams = data.sort((a, b) => {
          return new Date(a.Tarih) - new Date(b.Tarih);
        });
        
        setExams(sortedExams);
        console.log("✅ Student exams fetched successfully!");
        console.log("📋 Found", sortedExams.length, "exam items");
      } else {
        setExams([]);
        console.log("⚠️ No exam data returned");
      }
    } catch (error) {
      console.error("❌ Error fetching student exams:", error);
      Alert.alert("Hata", "Sınavlar yüklenirken bir hata oluştu");
      setExams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sayfada refresh işlemi
  const handleRefresh = () => {
    setRefreshing(true);
    fetchExams(false);
  };

  // Sınav detayına git
  const navigateToExamDetail = (exam) => {
    console.log("🔄 Navigating to exam detail:", exam);
    console.log("📱 Navigation object:", navigation);
    try {
      navigation.navigate("StudentExamDetail", { exam });
      console.log("✅ Navigation successful");
    } catch (error) {
      console.error("❌ Navigation error:", error);
      Alert.alert("Hata", "Sınav detayı açılamadı");
    }
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      return "Tarih bilinmiyor";
    }
  };

  // Sınav süresini formatla
  const formatDuration = (duration) => {
    const minutes = parseInt(duration);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours} saat ${remainingMinutes} dakika`
        : `${hours} saat`;
    }
    return `${minutes} dakika`;
  };

  // Sınavın ne kadar kaldığını hesapla
  const getTimeUntilExam = (dateString) => {
    try {
      const examDate = new Date(dateString);
      const now = new Date();
      const diffTime = examDate - now;
      
      if (diffTime < 0) {
        return "Sınav geçti";
      }
      
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return "Bugün";
      } else if (diffDays === 1) {
        return "Yarın";
      } else if (diffDays <= 7) {
        return `${diffDays} gün kaldı`;
      } else {
        return `${diffDays} gün kaldı`;
      }
    } catch (error) {
      return "";
    }
  };


  // İlk yükleme
  useEffect(() => {
    console.log("🚀 Component mounted, fetching exams...");
    fetchExams();
  }, []);

  // Yüklenme durumu
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FeaturePageHeader
          title="Sınavlarım"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Sınavlar yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <FeaturePageHeader
        title="Sınavlarım"
        onBackPress={() => navigation.goBack()}
        rightAction={{
          icon: "refresh",
          onPress: handleRefresh
        }}
      />

      <RefreshableScrollView
        refreshing={refreshing}
        onRefresh={handleRefresh}
        style={styles.scrollView}
      >
        <View style={styles.content}>
          <View style={styles.pageHeader}>
            <Text style={[styles.welcomeText, { color: "#666" }]}>
              Yaklaşan sınavlarınızı görüntüleyin
            </Text>
          </View>
        </View>

        {exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.emptyIcon, { color: "#333" }]}>📝</Text>
              <Text style={[styles.emptyText, { color: "#333" }]}>
                Henüz sınav bulunmuyor
              </Text>
              <Text style={[styles.emptySubtext, { color: "#666" }]}>
                Sınavlarınız burada görünecek
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.examsList}>
            {exams.map((exam, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.examCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  console.log("👆 Exam card pressed:", exam);
                  navigateToExamDetail(exam);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.examHeader}>
                  <View style={styles.examTitleArea}>
                    <Text style={[styles.examSubject, { color: "#333" }]}>
                      {exam.Ders}
                    </Text>
                    <Text style={[styles.examName, { color: "#333" }]}>
                      {exam.SinavAdi}
                    </Text>
                  </View>
                  <View style={styles.examDateArea}>
                    <Text style={[styles.examDate, { color: "#333" }]}>
                      {formatDate(exam.Tarih)}
                    </Text>
                    <Text style={[styles.timeUntil, { color: "#666" }]}>
                      {getTimeUntilExam(exam.Tarih)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.examInfoRow}>
                  <View style={[styles.infoBadge, { backgroundColor: "#f0f0f0" }]}>
                    <Text style={[styles.infoBadgeText, { color: "#333" }]}>
                      ⏱ {formatDuration(exam.SinavSuresi)}
                    </Text>
                  </View>
                  <View style={[styles.infoBadge, { backgroundColor: "#f0f0f0" }]}>
                    <Text style={[styles.infoBadgeText, { color: "#333" }]}>
                      🏫 {exam.Sinif}
                    </Text>
                  </View>
                </View>

                {exam.Aciklama && exam.Aciklama !== "..." && (
                  <Text style={[styles.examDescription, { color: "#666" }]} numberOfLines={2}>
                    💡 {exam.Aciklama}
                  </Text>
                )}

                <View style={styles.arrowContainer}>
                  <Text style={[styles.arrow, { color: "#333" }]}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </RefreshableScrollView>
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentExamsList" 
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 12,
  },
  refreshIcon: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  pageHeader: {
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    // Shadow özellikleri açıkça kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
  examsList: {
    paddingHorizontal: 20,
    paddingBottom: 80, // Alt menü için yeterli alan
  },
  examCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    // Shadow özellikleri açıkça kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  examHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  examTitleArea: {
    flex: 1,
    marginRight: 16,
  },
  examSubject: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  examName: {
    fontSize: 16,
    fontWeight: "600",
  },
  examDateArea: {
    alignItems: "flex-end",
  },
  examDate: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  timeUntil: {
    fontSize: 12,
    fontWeight: "600",
  },
  examInfoRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  infoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  examDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: "italic",
  },
  arrowContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  arrow: {
    fontSize: 20,
    fontWeight: "bold",
  },
};

export default StudentExamsList;
