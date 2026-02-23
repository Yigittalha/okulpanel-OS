import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../state/theme";
import api from "../../lib/api";
import StudentBottomMenu from "../../components/StudentBottomMenu";

const StudentTrialDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  
  const { trialId, trialName, trialDate, sozelPuan, sayisalPuan, OgrenciId } = route.params || {};
  
  const [trialDetail, setTrialDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState({});

  useEffect(() => {
    if (trialId) {
      fetchTrialDetail();
    }
  }, [trialId]);

  const fetchTrialDetail = async () => {
    try {
      setLoading(true);
      
      let studentId = OgrenciId;
      
      // Eğer OgrenciId route params'tan gelmediyse, kullanıcı bilgilerinden al
      if (!studentId) {
        console.log("🔍 Fetching user info for trial detail...");
        const userResponse = await api.post("/user/info", {});
        
        if (!userResponse?.data) {
          Alert.alert("Hata", "Kullanıcı bilgileri alınamadı");
          return;
        }

        studentId = userResponse.data.OgrenciId;
        
        if (!studentId) {
          Alert.alert("Hata", "Öğrenci ID bilgisi bulunamadı");
          return;
        }
      }

      console.log("🔍 Fetching trial detail for ID:", trialId, "Student ID:", studentId);
      
      const response = await api.post("/trial/student/get/one", {
        id: trialId,
        OgrenciId: studentId,
      });

      console.log("📡 Trial detail API Response received:", response.status);
      
      if (response?.data) {
        console.log("✅ Trial detail fetched successfully!");
        setTrialDetail(response.data);
      } else {
        console.log("⚠️ No trial detail data returned");
        setTrialDetail(null);
      }
    } catch (error) {
      console.error("❌ Error fetching trial detail:", error);
      Alert.alert("Hata", "Deneme detayları yüklenirken bir hata oluştu.");
      setTrialDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrialDetail();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getSubjectName = (subjectKey) => {
    const subjectMap = {
      "turkce": "Türkçe",
      "sosyal": "Sosyal Bilgiler",
      "din": "Din Kültürü ve Ahlak Bilgisi",
      "ingilizce": "İngilizce",
      "matematik": "Matematik",
      "fen": "Fen Bilimleri",
    };
    return subjectMap[subjectKey] || subjectKey.toUpperCase();
  };

  const toggleSubjectExpansion = (subjectKey) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectKey]: !prev[subjectKey]
    }));
  };

  const getQuestionsBySubject = (subjectKey) => {
    if (!trialDetail?.FinalJson) return [];
    return trialDetail.FinalJson
      .filter(question => question.ders === subjectKey)
      .sort((a, b) => a.sorusayisi - b.sorusayisi);
  };

  const getSubjectStats = () => {
    if (!trialDetail) return [];
    
    const subjects = [
      { key: "turkce", label: "Türkçe", color: "#10B981" },
      { key: "sosyal", label: "Sosyal Bilgiler", color: "#F59E0B" },
      { key: "din", label: "Din Kültürü ve Ahlak Bilgisi", color: "#8B5CF6" },
      { key: "ingilizce", label: "İngilizce", color: "#EF4444" },
      { key: "matematik", label: "Matematik", color: "#3B82F6" },
      { key: "fen", label: "Fen Bilimleri", color: "#06B6D4" },
    ];

    return subjects.map(subject => ({
      ...subject,
      dogru: trialDetail[`${subject.key}Dogru`] || 0,
      yanlis: trialDetail[`${subject.key}Yanlis`] || 0,
      bos: trialDetail[`${subject.key}Bos`] || 0,
      net: trialDetail[`${subject.key}Net`] || 0,
    }));
  };

  const renderSubjectCard = (subject) => {
    const isExpanded = expandedSubjects[subject.key];
    const subjectQuestions = getQuestionsBySubject(subject.key);
    
    return (
      <View
        key={subject.key}
        style={[styles.subjectCard, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
      >
        <TouchableOpacity
          style={styles.subjectHeader}
          onPress={() => toggleSubjectExpansion(subject.key)}
          activeOpacity={0.7}
        >
          <View style={styles.subjectHeaderLeft}>
            <View style={[styles.subjectIcon, { backgroundColor: subject.color + "20" }]}>
              <Text style={[styles.subjectIconText, { color: subject.color }]}>
                {subject.label.charAt(0)}
              </Text>
            </View>
            <Text style={[styles.subjectTitle, { color: isDark ? "#FFFFFF" : "#1E293B" }]}>
              {subject.label}
            </Text>
          </View>
          <View style={styles.subjectHeaderRight}>
            <Text style={[styles.questionCount, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              {subjectQuestions.length} soru
            </Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={isDark ? "#94A3B8" : "#64748B"} 
            />
          </View>
        </TouchableOpacity>
        
        <View style={styles.subjectStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Doğru
            </Text>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {subject.dogru}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Yanlış
            </Text>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>
              {subject.yanlis}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Boş
            </Text>
            <Text style={[styles.statValue, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              {subject.bos}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Net
            </Text>
            <Text style={[styles.statValue, { color: subject.color }]}>
              {subject.net.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Expanded Questions */}
        {isExpanded && subjectQuestions.length > 0 && (
          <View style={styles.expandedQuestions}>
            <Text style={[styles.expandedTitle, { color: isDark ? "#FFFFFF" : "#1E293B" }]}>
              📝 {subject.label} Soruları
            </Text>
            {subjectQuestions.map((question, index) => renderQuestionDetail(question, index))}
          </View>
        )}
      </View>
    );
  };

  const renderQuestionDetail = (question, index) => (
    <View
      key={index}
      style={[
        styles.questionCard,
        { 
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderLeftColor: question.sonuc === 1 ? "#10B981" : question.sonuc === 0 ? "#EF4444" : "#F59E0B",
        }
      ]}
    >
      <View style={styles.questionHeader}>
        <Text style={[styles.questionNumber, { color: isDark ? "#FFFFFF" : "#1E293B" }]}>
          {question.sorusayisi}
        </Text>
        <View style={styles.questionInfo}>
          <Text style={[styles.questionSubject, { color: isDark ? "#94A3B8" : "#64748B" }]}>
            {getSubjectName(question.ders)}
          </Text>
          <Text style={[styles.questionAnswer, { color: isDark ? "#FFFFFF" : "#1E293B" }]}>
            Doğru Cevap: {question.cevap}
          </Text>
        </View>
        <View style={[
          styles.questionStatus,
          { 
            backgroundColor: question.sonuc === 1 ? "#10B981" : question.sonuc === 0 ? "#EF4444" : "#F59E0B"
          }
        ]}>
          <Ionicons 
            name={question.sonuc === 1 ? "checkmark" : question.sonuc === 0 ? "close" : "help"} 
            size={16} 
            color="#FFFFFF" 
          />
        </View>
      </View>
      <Text style={[styles.questionKazanim, { color: isDark ? "#94A3B8" : "#64748B" }]}>
        {question.kazanim}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1E293B'} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              📊 Deneme Detayı
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {trialName || "Deneme Sonucu"}
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FFD60A', '#FFA500']}
            tintColor="#FFD60A"
            title="Yenileniyor..."
            titleColor={isDark ? '#FFFFFF' : '#1E293B'}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Yükleniyor...
            </Text>
          </View>
        ) : trialDetail ? (
          <>
            {/* Trial Info */}
            <View style={[styles.trialInfoCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <Text style={[styles.trialInfoTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                📋 Deneme Bilgileri
              </Text>
              <View style={styles.trialInfoContent}>
                <Text style={[styles.trialInfoText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  📅 Tarih: {formatDate(trialDate)}
                </Text>
                <Text style={[styles.trialInfoText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  📝 Deneme: {trialName}
                </Text>
              </View>
              
              {/* Scores Display */}
              <View style={styles.scoresContainer}>
                <View style={[styles.scoreCard, { backgroundColor: 'rgba(255, 214, 0, 0.1)', borderWidth: 1, borderColor: '#FFD60A' }]}>
                  <Text style={[styles.scoreTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                    🏆 Puan
                  </Text>
                  <Text style={[styles.scoreValue, { color: '#FFD60A', fontWeight: 'bold', fontSize: 20 }]}>
                    {((sozelPuan || 0) + (sayisalPuan || 0)).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Subject Statistics */}
            <View style={styles.subjectsSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                📊 Ders İstatistikleri
              </Text>
              {getSubjectStats().map(renderSubjectCard)}
            </View>

          </>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            <Ionicons name="document-text-outline" size={48} color={isDark ? '#94A3B8' : '#64748B'} />
            <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Deneme detayları bulunamadı
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Alt Menü - Sadece öğrenci için göster */}
      {!OgrenciId && (
        <StudentBottomMenu 
          navigation={navigation} 
          currentRoute="StudentTrialDetail" 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  trialInfoCard: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trialInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  trialInfoContent: {
    gap: 8,
  },
  trialInfoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoresContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
  scoreCard: {
    width: 120,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  subjectsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  subjectCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  subjectHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  expandedQuestions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  expandedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  questionsSection: {
    marginBottom: 30,
  },
  questionCard: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  questionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  questionSubject: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  questionAnswer: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionKazanim: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default StudentTrialDetail;
