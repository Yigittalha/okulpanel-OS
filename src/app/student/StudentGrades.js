import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import api, { fetchUserInfo } from "../../lib/api";
import RefreshableScrollView from "../../components/RefreshableScrollView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudentBottomMenu from "../../components/StudentBottomMenu";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const StudentGrades = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { openMenu } = useSlideMenu();
  const insets = useSafeAreaInsets();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

  // Sayfa yüklendiğinde notları getir
  useEffect(() => {
    fetchGrades();
  }, []);

  // Notları API'den getir
  const fetchGrades = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Önce kullanıcı bilgilerini al
      console.log("🔍 Fetching user info for grades...");
      const userResponse = await fetchUserInfo(true);
      
      if (!userResponse?.data && !userResponse?.OgrenciId) {
        // fetchUserInfo bazen direkt data döndürür, bazen response.data
        const userData = userResponse?.data || userResponse;
        if (!userData?.OgrenciId) {
          Alert.alert("Hata", "Öğrenci bilgileri alınamadı");
          return;
        }
        setStudentInfo(userData);
      } else {
        setStudentInfo(userResponse.data || userResponse);
      }

      const studentData = userResponse?.data || userResponse;
      console.log("👤 Student info received:", studentData);

      if (!studentData?.OgrenciId) {
        Alert.alert("Hata", "Öğrenci ID bilgisi bulunamadı");
        return;
      }

      console.log("🔍 Fetching student grades for OgrenciId:", studentData.OgrenciId);
      console.log("🌐 API URL:", "/student/point");
      console.log("📤 Request body:", { OgrenciId: studentData.OgrenciId });

      const response = await api.post("/student/point", {
        OgrenciId: studentData.OgrenciId,
      });

      console.log("📡 API Response received:", response.status);
      console.log("📋 Response data:", response.data);

      const data = response?.data;

      if (data && Array.isArray(data)) {
        // Tarihe göre sırala (en yeni en üstte)
        const sortedGrades = data.sort((a, b) => {
          return new Date(b.Tarih) - new Date(a.Tarih);
        });
        
        setGrades(sortedGrades);
        console.log("✅ Student grades fetched successfully!");
        console.log("📋 Found", sortedGrades.length, "grade records");
      } else {
        setGrades([]);
        console.log("⚠️ No grade data returned");
      }
    } catch (error) {
      console.error("❌ Error fetching student grades:", error);
      Alert.alert("Hata", "Notlar yüklenirken bir hata oluştu");
      setGrades([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sayfada refresh işlemi
  const handleRefresh = () => {
    setRefreshing(true);
    fetchGrades(false);
  };

  // Tarihi formatla (gg.aa.yyyy)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Puan rengini belirle
  const getGradeColor = (puan) => {
    const score = parseInt(puan);
    if (score >= 85) return "#4CAF50"; // Yeşil
    if (score >= 70) return "#FF9800"; // Turuncu
    if (score >= 50) return "#FFC107"; // Sarı
    return "#F44336"; // Kırmızı
  };

  // Not kartını render et
  const renderGradeItem = ({ item, index }) => (
    <View
      style={[
        styles.gradeCard,
        { 
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderLeftColor: getGradeColor(item.puan),
        }
      ]}
    >
      <View style={styles.gradeHeader}>
        <View style={styles.subjectArea}>
          <Text style={[styles.subjectName, { color: theme.text }]}>
            {item.Ders}
          </Text>
          <Text style={[styles.examName, { color: "#9CA3AF" }]}>
            {item.SinavAdi}
          </Text>
        </View>
        <View style={styles.scoreArea}>
          <Text style={[styles.score, { color: getGradeColor(item.puan) }]}>
            {item.puan}
          </Text>
          <Text style={[styles.scoreLabel, { color: "#9CA3AF" }]}>
            puan
          </Text>
        </View>
      </View>
      
      <View style={styles.gradeFooter}>
        <Text style={[styles.date, { color: "#9CA3AF" }]}>
          📅 {formatDate(item.Tarih)}
        </Text>
        <Text style={[styles.studentInfo, { color: "#9CA3AF" }]}>
          {item.AdSoyad} • No: {item.OgrenciNumara}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[
          styles.header, 
          { 
            borderBottomColor: theme.border,
            paddingTop: Math.max(insets.top + 10, 35), // Dinamik top padding
          }
        ]}>
          <TouchableOpacity style={styles.menuButton} onPress={openMenu}>
            <Text style={[styles.menuIcon, { color: theme.text }]}>☰</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Notlarım
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Notlar yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <FeaturePageHeader
        title="Notlarım"
        onBackPress={() => navigation.goBack()}
      />

      {grades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon, { color: "#9CA3AF" }]}>
            📊
          </Text>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Henüz hiç notunuz bulunmuyor
          </Text>
          <Text style={[styles.emptySubText, { color: "#9CA3AF" }]}>
            Öğretmenleriniz not girdiğinde burada görünecektir
          </Text>
        </View>
      ) : (
        <FlatList
          data={grades}
          renderItem={renderGradeItem}
          keyExtractor={(item, index) => `${item.Ders}-${item.SinavAdi}-${index}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentGrades" 
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
    width: 44,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Extra bottom space for all devices
  },
  gradeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    // Gölge tamamen kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  gradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subjectArea: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  examName: {
    fontSize: 14,
    opacity: 0.8,
  },
  scoreArea: {
    alignItems: "center",
  },
  score: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scoreLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  gradeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    opacity: 0.8,
  },
  studentInfo: {
    fontSize: 12,
    opacity: 0.8,
  },
});

export default StudentGrades;