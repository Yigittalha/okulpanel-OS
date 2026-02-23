import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { fetchUserInfo } from '../../lib/api';
import { useTheme } from '../../state/theme';
import FeaturePageHeader from '../../components/FeaturePageHeader';

const ENDPOINT = '/schedule/getteacher';

export default function TeacherSchedule() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchTeacherSchedule();
  }, []);

  // Sayfa her focus olduğunda veriyi yenile
  useFocusEffect(
    React.useCallback(() => {
      fetchTeacherSchedule();
    }, [])
  );

  const fetchTeacherSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      // Sadece öğretmen: /user/info'dan OgretmenID çek
      const userInfo = await fetchUserInfo(false);
      const teacherId = userInfo?.OgretmenID;

      if (!teacherId) {
        setError('Bu sayfa yalnız öğretmenler içindir. Öğretmen girişi yapınız.');
        setLoading(false);
        return;
      }

      // API: POST body { id: teacherId }
      const response = await api.post(ENDPOINT, { id: teacherId });
      const scheduleData = Array.isArray(response?.data) ? response.data : [];
      
      // Günlere göre sırala
      const orderedDays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
      const sortedData = scheduleData.sort((a, b) => {
        const dayOrderA = orderedDays.indexOf(a.Gun);
        const dayOrderB = orderedDays.indexOf(b.Gun);
        
        if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;
        
        // Aynı gün içinde saat sıralaması
        const timeA = a.DersSaati.split("-")[0];
        const timeB = b.DersSaati.split("-")[0];
        return timeA.localeCompare(timeB);
      });

      setData(sortedData);
    } catch (error) {
      setError(`Ders programı alınamadı: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Günlere göre grupla
  const sections = useMemo(() => {
    const map = new Map();
    for (const item of data) {
      const key = item.Gun || 'Diğer';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map.entries()).map(([title, items]) => ({
      title,
      data: items
    }));
  }, [data]);

  const topPad = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background || '#fff' }}>
        <FeaturePageHeader 
          title="Yoklama Dersleri" 
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Ders programı yükleniyor…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background || '#fff' }}>
        <FeaturePageHeader 
          title="Yoklama Dersleri" 
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.accent }]}
            onPress={fetchTeacherSchedule}
          >
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background || '#fff' }}>
      <FeaturePageHeader 
        title="Yoklama Dersleri" 
        onBackPress={() => navigation.goBack()}
      />

      {/* Ders Listesi */}
      <SectionList
        sections={sections}
        stickySectionHeadersEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 80 }}
        keyExtractor={(item) => String(item.ProgramID)}

        renderItem={({ item, index }) => {
          // Durum kontrolü
          const getCardStyle = () => {
            if (item.durum === 1 || item.durum === 2) {
              return {
                backgroundColor: '#D1FAE5', // Yeşil arka plan
                borderLeftColor: '#10B981' // Yeşil sol kenar
              };
            }
            return {
              backgroundColor: theme.card || '#fff',
              borderLeftColor: theme.accent || '#4F46E5'
            };
          };

          const getTimeColor = () => {
            if (item.durum === 1 || item.durum === 2) {
              return '#059669'; // Yeşil renk
            }
            return theme.accent || '#4F46E5'; // Varsayılan renk
          };

          const getStatusMessage = () => {
            if (item.durum === 2) {
              return (
                <View style={styles.statusWarning}>
                  <Text style={styles.statusWarningText}>⚠️ Kazanım eklenmedi</Text>
                </View>
              );
            }
            return null;
          };

          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('Attendance', {
                Sinif: item.Sinif,
                DersSaati: item.DersSaati,
                ProgramID: String(item.ProgramID),
                Gun: item.Gun,
                Ders: item.Ders,
                Tarih: new Date().toISOString().split('T')[0]
              })}
              style={[styles.scheduleCard, getCardStyle()]}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={styles.lessonHeader}>
                  <Text style={[styles.lessonTitle, { color: theme.text || '#1F2937' }]}>
                    {item.Ders}
                  </Text>
                  <Text style={[styles.lessonTime, { color: getTimeColor() }]}>
                    {item.DersSaati}
                  </Text>
                </View>
                
                <View style={styles.lessonDetails}>
                  <Text style={[styles.classInfo, { color: theme.textSecondary || '#6B7280' }]}>
                    📍 {item.Sinif}
                  </Text>
                  <Text style={[styles.teacherInfo, { color: theme.textSecondary || '#6B7280' }]}>
                    👨‍🏫 {item.Ogretmen}
                  </Text>
                </View>

                {getStatusMessage()}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ color: theme.text }}>Bu öğretmen için ders bulunamadı.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f2f2f7', // Default background for header
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Default border color
  },
  sectionTitle: {
    fontWeight: '700',
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Default border color
  },
  lessonInfo: {
    flex: 1,
  },
  lessonName: {
    fontWeight: '600',
    fontSize: 16,
  },
  lessonDetails: {
    fontSize: 14,
    opacity: 0.8,
  },
  lessonTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyContainer: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderLeftWidth: 4,
    // Gölge tamamen kaldırıldı (flat design)
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  cardContent: {
    padding: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  lessonTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  lessonDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfo: {
    fontSize: 14,
    fontWeight: '400',
  },
  teacherInfo: {
    fontSize: 14,
    fontWeight: '400',
  },
  statusWarning: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  statusWarningText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
    fontStyle: 'italic',
  },
});
