import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeaturePageHeader from "../../components/FeaturePageHeader";
import StudentBottomMenu from "../../components/StudentBottomMenu";

const StudentExamDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { exam } = route.params;
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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

  const timeUntilExam = getTimeUntilExam(exam.Tarih);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <FeaturePageHeader
        title="Sınav Detayı"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
      >

        {/* Sınav Genel Bilgileri */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Text style={[styles.heroIconText, { color: "#333" }]}>📝</Text>
            </View>
            <View style={styles.heroContent}>
              <Text style={[styles.heroSubject, { color: "#333" }]}>
                {exam.Ders}
              </Text>
              <Text style={[styles.heroExamName, { color: "#333" }]}>
                {exam.SinavAdi}
              </Text>
            </View>
            <View style={[styles.heroTimeTag, { backgroundColor: "#f0f0f0" }]}>
              <Text style={[styles.heroTimeText, { color: "#333" }]}>
                {getTimeUntilExam(exam.Tarih)}
              </Text>
            </View>
          </View>
        </View>

        {/* Detay Bilgileri */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: "#333" }]}>
            📋 Sınav Detayları
          </Text>

          <View style={styles.detailGrid}>
            <View style={[styles.detailItem, { backgroundColor: "#f0f0f0" }]}>
              <Text style={[styles.detailIcon, { color: "#333" }]}>📅</Text>
              <Text style={[styles.detailLabel, { color: "#666" }]}>
                Tarih
              </Text>
              <Text style={[styles.detailValue, { color: "#333" }]}>
                {formatDate(exam.Tarih)}
              </Text>
            </View>

            <View style={[styles.detailItem, { backgroundColor: "#f0f0f0" }]}>
              <Text style={[styles.detailIcon, { color: "#333" }]}>⏱</Text>
              <Text style={[styles.detailLabel, { color: "#666" }]}>
                Süre
              </Text>
              <Text style={[styles.detailValue, { color: "#333" }]}>
                {formatDuration(exam.SinavSuresi)}
              </Text>
            </View>

            <View style={[styles.detailItem, { backgroundColor: "#f0f0f0" }]}>
              <Text style={[styles.detailIcon, { color: "#333" }]}>🏫</Text>
              <Text style={[styles.detailLabel, { color: "#666" }]}>
                Sınıf
              </Text>
              <Text style={[styles.detailValue, { color: "#333" }]}>
                {exam.Sinif}
              </Text>
            </View>

            <View style={[styles.detailItem, { backgroundColor: "#f0f0f0" }]}>
              <Text style={[styles.detailIcon, { color: "#333" }]}>📚</Text>
              <Text style={[styles.detailLabel, { color: "#666" }]}>
                Ders
              </Text>
              <Text style={[styles.detailValue, { color: "#333" }]}>
                {exam.Ders}
              </Text>
            </View>
          </View>
        </View>

        {/* Açıklama */}
        {exam.Aciklama && exam.Aciklama !== "..." && (
          <View style={[styles.descriptionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: "#333" }]}>
              💡 Açıklama
            </Text>
            <Text style={[styles.description, { color: "#333" }]}>
              {exam.Aciklama}
            </Text>
          </View>
        )}

        {/* Hatırlatma Notları */}
        <View style={[styles.notesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: "#333" }]}>
            📝 Sınav Notları
          </Text>
          <Text style={[styles.noteText, { color: "#666" }]}>
            • Sınavdan 15 dakika önce sınıfta bulunun
          </Text>
          <Text style={[styles.noteText, { color: "#666" }]}>
            • Gerekli malzemelerinizi yanınızda bulundurun
          </Text>
          <Text style={[styles.noteText, { color: "#666" }]}>
            • Kimlik belgenizi getirmeyi unutmayın
          </Text>
        </View>
      </ScrollView>
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentExamDetail" 
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeUntilHeader: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heroCard: {
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    // Shadow özellikleri açıkça kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    marginRight: 16,
  },
  heroIconText: {
    fontSize: 32,
  },
  heroContent: {
    flex: 1,
  },
  heroSubject: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  heroExamName: {
    fontSize: 18,
    fontWeight: "600",
  },
  heroTimeTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  heroTimeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailsCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    // Shadow özellikleri açıkça kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  descriptionCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    // Shadow özellikleri açıkça kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
  },
  notesCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    // Shadow özellikleri açıkça kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
};

export default StudentExamDetail;
