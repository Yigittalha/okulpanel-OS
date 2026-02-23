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

const TeacherTrialGainStats = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { schoolCode } = useContext(SessionContext);
  
  const { trialId, trialName, className } = route.params;
  const [gainStats, setGainStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGains, setExpandedGains] = useState(new Set());

  const toggleGainExpansion = (gainKey) => {
    const newExpanded = new Set(expandedGains);
    if (newExpanded.has(gainKey)) {
      newExpanded.delete(gainKey);
    } else {
      newExpanded.add(gainKey);
    }
    setExpandedGains(newExpanded);
  };

  useEffect(() => {
    fetchGainStats();
  }, [trialId, className]);

  const fetchGainStats = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching gain statistics for trial:", trialId, "class:", className);
      
      const response = await api.post("/trial/statistics/gain", {
        id: trialId,
        Sinif: className
      });
      
      console.log("📡 Gain statistics API Response received:", response.status);
      console.log("📋 Raw response data:", JSON.stringify(response.data, null, 2));
      
      if (response?.data) {
        console.log("✅ Gain statistics fetched successfully!");
        // API'den gelen veri {className: {subject: {gain: stats}}} formatında
        // İlk sınıfın verilerini al (className ile eşleşen)
        const classData = response.data[className];
        if (classData) {
          console.log("📊 Class data found:", classData);
          setGainStats(classData);
        } else {
          console.log("⚠️ No data found for class:", className);
          setGainStats({});
        }
      } else {
        console.log("⚠️ No gain statistics returned");
        setGainStats({});
      }
    } catch (error) {
      console.error("❌ Error fetching gain statistics:", error);
      console.error("❌ Error message:", error.message);
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
      }
      
      Alert.alert(
        "Hata",
        "Kazanım istatistikleri yüklenirken bir hata oluştu.",
        [{ text: "Tamam" }]
      );
      setGainStats({});
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGainStats();
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

  const renderGainCard = (subject, gainData) => (
    <View key={subject} style={[styles.gainCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
      {/* Ders Header */}
      <View style={styles.gainHeader}>
        <View style={[styles.gainIcon, { backgroundColor: getSubjectColor(subject) + '20' }]}>
          <Text style={[styles.gainIconText, { color: getSubjectColor(subject) }]}>
            {getSubjectName(subject).charAt(0)}
          </Text>
        </View>
        <View style={styles.gainInfo}>
          <Text style={[styles.gainSubjectName, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            {getSubjectName(subject)}
          </Text>
          <Text style={[styles.gainSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {Object.keys(gainData).length} Kazanım
          </Text>
        </View>
      </View>

      {/* Kazanımlar */}
      <View style={styles.gainsContainer}>
        {Object.entries(gainData).map(([gainText, stats]) => {
          const gainKey = `${subject}-${gainText}`;
          const isExpanded = expandedGains.has(gainKey);
          const shouldTruncate = gainText.length > 80;
          
          return (
            <View key={gainText} style={[styles.gainItem, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
              <TouchableOpacity 
                style={styles.gainItemHeader}
                onPress={() => shouldTruncate ? toggleGainExpansion(gainKey) : null}
                activeOpacity={shouldTruncate ? 0.7 : 1}
              >
                <Text style={[styles.gainText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                  {shouldTruncate && !isExpanded ? gainText.substring(0, 80) + '...' : gainText}
                </Text>
                <View style={styles.gainHeaderRight}>
                  <View style={[styles.gainBadge, { backgroundColor: getSubjectColor(subject) + '20' }]}>
                    <Text style={[styles.gainBadgeText, { color: getSubjectColor(subject) }]}>
                      {stats.basariYuzdesi !== undefined && stats.basariYuzdesi !== null ? stats.basariYuzdesi.toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                  {shouldTruncate && (
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={isDark ? '#94A3B8' : '#64748B'} 
                      style={styles.expandIcon}
                    />
                  )}
                </View>
              </TouchableOpacity>
            
            <View style={styles.gainStats}>
              <View style={styles.gainStatRow}>
                <View style={styles.gainStatItem}>
                  <Text style={[styles.gainStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Ort. Doğru
                  </Text>
                  <Text style={[styles.gainStatValue, { color: '#10B981' }]}>
                    {stats.ortalamaDogru !== undefined && stats.ortalamaDogru !== null ? stats.ortalamaDogru.toFixed(2) : '0.00'}
                  </Text>
                </View>
                <View style={styles.gainStatItem}>
                  <Text style={[styles.gainStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Ort. Yanlış
                  </Text>
                  <Text style={[styles.gainStatValue, { color: '#EF4444' }]}>
                    {stats.ortalamaYanlis !== undefined && stats.ortalamaYanlis !== null ? stats.ortalamaYanlis.toFixed(2) : '0.00'}
                  </Text>
                </View>
                <View style={styles.gainStatItem}>
                  <Text style={[styles.gainStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Ort. Boş
                  </Text>
                  <Text style={[styles.gainStatValue, { color: '#F59E0B' }]}>
                    {stats.ortalamaBos !== undefined && stats.ortalamaBos !== null ? stats.ortalamaBos.toFixed(2) : '0.00'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.gainStatRow}>
                <View style={styles.gainStatItem}>
                  <Text style={[styles.gainStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Toplam Soru
                  </Text>
                  <Text style={[styles.gainStatValue, { color: '#3B82F6' }]}>
                    {stats.ortalamaToplamSoru !== undefined && stats.ortalamaToplamSoru !== null ? stats.ortalamaToplamSoru.toFixed(2) : '0.00'}
                  </Text>
                </View>
                <View style={styles.gainStatItem}>
                  <Text style={[styles.gainStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Başarı %
                  </Text>
                  <Text style={[styles.gainStatValue, { color: '#FFD60A' }]}>
                    {stats.basariYuzdesi !== undefined && stats.basariYuzdesi !== null ? stats.basariYuzdesi.toFixed(1) : '0.0'}%
                  </Text>
                </View>
              </View>
            </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trending-up-outline" size={64} color={isDark ? '#64748B' : '#94A3B8'} />
      <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
        Kazanım istatistiği bulunamadı
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
        Bu sınıf için henüz kazanım istatistiği yok
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
              {className} - Kazanım İstatistikleri
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
              Kazanım istatistikleri yükleniyor...
            </Text>
          </View>
        ) : Object.keys(gainStats).length > 0 ? (
          <>
            {/* Kazanım İstatistikleri */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                📈 Kazanım İstatistikleri
              </Text>
              
              {Object.entries(gainStats).map(([subject, gainData]) => 
                renderGainCard(subject, gainData)
              )}
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
    marginBottom: 16,
  },
  gainCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gainIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gainIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  gainInfo: {
    flex: 1,
  },
  gainSubjectName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  gainSubtitle: {
    fontSize: 12,
  },
  gainsContainer: {
    gap: 12,
  },
  gainItem: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gainItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gainHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandIcon: {
    marginLeft: 4,
  },
  gainText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
    marginRight: 8,
  },
  gainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  gainBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gainStats: {
    gap: 8,
  },
  gainStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gainStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  gainStatLabel: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
  },
  gainStatValue: {
    fontSize: 14,
    fontWeight: '700',
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
});

export default TeacherTrialGainStats;
