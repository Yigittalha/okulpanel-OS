import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../lib/api";

const TeacherTrialStatistics = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { schoolCode } = useContext(SessionContext);
  
  const { trialId, trialName } = route.params;
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [trialId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching trial statistics for ID:", trialId);
      
      const response = await api.post("/trial/statistics/class", {
        id: trialId
      });
      
      console.log("📡 Trial statistics API Response received:", response.status);
      console.log("📋 Raw response data:", JSON.stringify(response.data, null, 2));
      
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log("✅ Trial statistics fetched successfully!");
        // İlk diziyi kullan (API'den gelen veri [[...]] formatında)
        const firstArray = response.data[0];
        console.log("📊 First array:", firstArray);
        if (firstArray && Array.isArray(firstArray) && firstArray.length > 0) {
          // Tüm sınıfların istatistiklerini kullan
          console.log("📈 All classes statistics:", firstArray);
          setStatistics(firstArray);
        } else {
          console.log("⚠️ Invalid statistics data format - first array is empty or invalid");
          setStatistics([]);
        }
      } else {
        console.log("⚠️ No trial statistics returned");
        setStatistics([]);
      }
    } catch (error) {
      console.error("❌ Error fetching trial statistics:", error);
      console.error("❌ Error message:", error.message);
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
      }
      
      Alert.alert(
        "Hata",
        "İstatistikler yüklenirken bir hata oluştu.",
        [{ text: "Tamam" }]
      );
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
    setRefreshing(false);
  };

  const getSubjectColor = (subject) => {
    const colors = {
      turkce: '#EF4444',
      sosyal: '#3B82F6',
      din: '#10B981',
      ingilizce: '#8B5CF6',
      matematik: '#F59E0B',
      fen: '#06B6D4'
    };
    return colors[subject] || '#64748B';
  };

  const getSubjectName = (subject) => {
    const names = {
      turkce: 'Türkçe',
      sosyal: 'Sosyal Bilgiler',
      din: 'Din Kültürü',
      ingilizce: 'İngilizce',
      matematik: 'Matematik',
      fen: 'Fen Bilimleri'
    };
    return names[subject] || subject;
  };

  const renderStatCard = (title, value, subtitle, color = '#FFD60A') => (
    <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
      <Text style={[styles.statTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
        {title}
      </Text>
      <Text style={[styles.statValue, { color }]}>
        {value !== undefined && value !== null ? value.toFixed(1) : '0.0'}
      </Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderClassStats = () => {
    if (!statistics || statistics.length === 0) return null;

    return statistics.map((classData, index) => (
      <View key={classData.Sinif || index} style={[styles.classCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        {/* Sınıf Header */}
        <View style={styles.classHeader}>
          <View style={styles.classIcon}>
            <Text style={[styles.classIconText, { color: '#FFD60A' }]}>
              {classData.Sinif?.charAt(0) || 'S'}
            </Text>
          </View>
          <View style={styles.classInfo}>
            <Text style={[styles.className, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              {classData.Sinif || 'Bilinmeyen Sınıf'}
            </Text>
            <Text style={[styles.classSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Sınıf Ortalaması
            </Text>
          </View>
          <View style={styles.classScore}>
            <Text style={[styles.classScoreValue, { color: '#FFD60A' }]}>
              {classData.puan !== undefined && classData.puan !== null ? classData.puan.toFixed(1) : '0.0'}
            </Text>
            <Text style={[styles.classScoreLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Puan
            </Text>
          </View>
        </View>

        {/* Kazanım Butonu */}
        <TouchableOpacity 
          style={styles.gainStatsButton}
          onPress={() => navigation.navigate('TeacherTrialGainStats', { 
            trialId: trialId, 
            trialName: trialName,
            className: classData.Sinif 
          })}
          activeOpacity={0.7}
        >
          <Ionicons name="trending-up" size={18} color="#FFD60A" />
          <Text style={styles.gainStatsText}>Kazanım İstatistiği</Text>
        </TouchableOpacity>

        {/* Genel İstatistikler */}
        <View style={styles.classGeneralStats}>
          <View style={styles.generalStatItem}>
            <Text style={[styles.generalStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Toplam Net
            </Text>
            <Text style={[styles.generalStatValue, { color: '#10B981' }]}>
              {classData.toplamNet !== undefined && classData.toplamNet !== null ? classData.toplamNet.toFixed(1) : '0.0'}
            </Text>
          </View>
          <View style={styles.generalStatItem}>
            <Text style={[styles.generalStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Toplam Doğru
            </Text>
            <Text style={[styles.generalStatValue, { color: '#3B82F6' }]}>
              {classData.toplamDogru !== undefined && classData.toplamDogru !== null ? classData.toplamDogru.toFixed(1) : '0.0'}
            </Text>
          </View>
          <View style={styles.generalStatItem}>
            <Text style={[styles.generalStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Toplam Yanlış
            </Text>
            <Text style={[styles.generalStatValue, { color: '#EF4444' }]}>
              {classData.toplamYanlis !== undefined && classData.toplamYanlis !== null ? classData.toplamYanlis.toFixed(1) : '0.0'}
            </Text>
          </View>
        </View>

        {/* Ders Bazlı İstatistikler */}
        <View style={styles.classSubjects}>
          {[
            [
              { key: 'turkce', dogru: classData.turkceDogru, yanlis: classData.turkceYanlis, net: classData.turkceNet },
              { key: 'sosyal', dogru: classData.sosyalDogru, yanlis: classData.sosyalYanlis, net: classData.sosyalNet }
            ],
            [
              { key: 'din', dogru: classData.dinDogru, yanlis: classData.dinYanlis, net: classData.dinNet },
              { key: 'ingilizce', dogru: classData.ingilizceDogru, yanlis: classData.ingilizceYanlis, net: classData.ingilizceNet }
            ],
            [
              { key: 'matematik', dogru: classData.matematikDogru, yanlis: classData.matematikYanlis, net: classData.matematikNet },
              { key: 'fen', dogru: classData.fenDogru, yanlis: classData.fenYanlis, net: classData.fenNet }
            ]
          ].map((subjectPair, pairIndex) => (
            <View key={pairIndex} style={styles.subjectPair}>
              {subjectPair.map((subject) => (
                <View key={subject.key} style={styles.subjectRow}>
                  <View style={styles.subjectHeader}>
                    <View style={[styles.subjectDot, { backgroundColor: getSubjectColor(subject.key) }]} />
                    <Text style={[styles.subjectName, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                      {getSubjectName(subject.key)}
                    </Text>
                  </View>
                  <View style={styles.subjectStats}>
                    <Text style={[styles.subjectNet, { color: getSubjectColor(subject.key) }]}>
                      {subject.net !== undefined && subject.net !== null ? subject.net.toFixed(1) : '0.0'} Net
                    </Text>
                    <Text style={[styles.subjectDetails, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {subject.dogru !== undefined && subject.dogru !== null ? subject.dogru.toFixed(1) : '0.0'}D / {subject.yanlis !== undefined && subject.yanlis !== null ? subject.yanlis.toFixed(1) : '0.0'}Y
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    ));
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="stats-chart-outline" size={64} color={isDark ? '#64748B' : '#94A3B8'} />
      <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
        İstatistik bulunamadı
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
        Bu deneme için henüz istatistik yok
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1E293B'} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              {trialName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Sınıf İstatistikleri
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
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
            <Text style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              İstatistikler yükleniyor...
            </Text>
          </View>
        ) : statistics && statistics.length > 0 ? (
          <>
            {/* Sınıf İstatistikleri */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                📊 Sınıf İstatistikleri
              </Text>
           
           
           
              {renderClassStats()}
            </View>
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
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
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  subjectCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  subjectName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  subjectStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginLeft: 6,
    marginRight: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  netContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  netValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  classCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD60A20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  classSubtitle: {
    fontSize: 12,
  },
  classScore: {
    alignItems: 'flex-end',
  },
  classScoreValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  classScoreLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  gainStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD60A20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD60A30',
  },
  gainStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD60A',
    marginLeft: 6,
  },
  classGeneralStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  generalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  generalStatLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  generalStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  classSubjects: {
    gap: 8,
  },
  subjectPair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  subjectRow: {
    flexDirection: 'column',
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
    justifyContent: 'center',
  },
  subjectDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 6,
  },
  subjectStats: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectNet: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 1,
    textAlign: 'center',
  },
  subjectDetails: {
    fontSize: 8,
    textAlign: 'center',
  },
});

export default TeacherTrialStatistics;
