import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { fetchUserInfo, fetchTeacherExams } from "../../lib/api";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const ExamsList = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { clearSession } = useContext(SessionContext);

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherData, setTeacherData] = useState(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const userData = await fetchUserInfo(true);

      if (userData && userData.OgretmenID) {
        setTeacherData(userData);
        await fetchExams(userData.OgretmenID);
      } else {
        Alert.alert(
          "Hata",
          "Öğretmen bilgileri alınamadı. Lütfen tekrar giriş yapın.",
          [{ text: "Tamam", onPress: () => clearSession() }],
        );
      }
    } catch (error) {
      console.error("Öğretmen bilgileri alınırken hata oluştu:", error);
      Alert.alert(
        "Hata",
        "Öğretmen bilgileri alınamadı. Lütfen tekrar giriş yapın.",
        [{ text: "Tamam", onPress: () => clearSession() }],
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async (ogretmenID) => {
    try {
      setRefreshing(true);
      const examsList = await fetchTeacherExams(ogretmenID);
      setExams(examsList);
    } catch (error) {
      console.error("Sınavları çekme hatası:", error);

      // Daha detaylı hata mesajı
      const errorMessage = error.response
        ? `Sunucu hatası: ${error.response.status} - ${error.response.data?.message || "Bilinmeyen hata"}`
        : "Sınavlar yüklenirken bir bağlantı hatası oluştu";

      Alert.alert("Hata", errorMessage, [
        {
          text: "Tekrar Dene",
          onPress: () => fetchExams(ogretmenID),
        },
        {
          text: "İptal",
          style: "cancel",
        },
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (teacherData) {
      fetchExams(teacherData.OgretmenID);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const renderExamItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.examCard,
        {
          backgroundColor: theme.card,
          borderLeftColor:
            item.Ders === "Matematik"
              ? theme.accent
              : item.Ders === "Türkçe"
                ? theme.warning
                : theme.primary,
          borderLeftWidth: 5,
        },
      ]}
      onPress={() => navigation.navigate("ExamDetail", { exam: item })}
    >
      <View style={styles.examHeader}>
        <View style={styles.examTitleContainer}>
          <Text style={[styles.examTitle, { color: theme.text }]}>
            {item.SinavAdi}
          </Text>
          <Text style={[styles.examSubtitle, { color: "#9CA3AF" }]}>
            {item.Ders} - {item.Sinif}
          </Text>
        </View>
        <View style={styles.examBadgeContainer}>
          <Text
            style={[
              styles.examBadge,
              {
                backgroundColor: theme.accent + "20",
                color: theme.accent,
              },
            ]}
          >
            {item.SinavSuresi} dk
          </Text>
        </View>
      </View>

      <View style={styles.examFooter}>
        <Text style={[styles.examDate, { color: "#9CA3AF" }]}>
          📅 {formatDate(item.Tarih)}
        </Text>
        {item.Aciklama && (
          <Text
            style={[styles.examDescription, { color: "#9CA3AF" }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            📝 {item.Aciklama}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FeaturePageHeader 
          title="Sınavlarım" 
          onBackPress={() => navigation.goBack()}
          rightIcon="add"
          onRightIconPress={() => navigation.navigate('ExamAdd')}
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
      <FeaturePageHeader 
        title="Sınavlarım" 
        onBackPress={() => navigation.goBack()}
        rightIcon="add"
        onRightIconPress={() => navigation.navigate('ExamAdd')}
      />

      {/* Büyük artı butonu kaldırıldı - header'daki küçük ikon kullanılıyor */}

      {exams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon, { color: "#9CA3AF" }]}>
            📋
          </Text>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Henüz hiç sınav eklenmemiş
          </Text>
          <TouchableOpacity
            style={[
              styles.addExamButton,
              {
                backgroundColor: isDark ? theme.accent : "#007AFF",
                opacity: 0.9,
              },
            ]}
            onPress={() => navigation.navigate("ExamAdd")}
          >
            <Text style={[styles.addExamButtonText, { color: "#fff" }]}>
              İlk Sınavı Ekle
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={exams}
          renderItem={renderExamItem}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Büyük artı butonu stilleri kaldırıldı - header'daki küçük ikon kullanılıyor
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  examCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    // Gölge tamamen kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  examHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  examTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  examSubtitle: {
    fontSize: 14,
  },
  examBadgeContainer: {
    alignItems: "flex-end",
  },
  examBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "600",
  },
  examFooter: {
    marginTop: 8,
  },
  examDate: {
    fontSize: 13,
    marginBottom: 4,
  },
  examDescription: {
    fontSize: 13,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  addExamButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  addExamButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ExamsList;
