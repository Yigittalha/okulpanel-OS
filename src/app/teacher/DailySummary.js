import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import LinearGradient from 'expo-linear-gradient';
import api, { fetchUserInfo } from '../../lib/api';

const { width } = Dimensions.get('window');

const DailySummary = ({ navigation }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    todayLessons: 0,
    completedLessons: 0,
    pendingLessons: 0,
    homeworkGiven: 0,
    examsToday: 0,
  });
  const [userInfo, setUserInfo] = useState(null);
  const [schoolCode, setSchoolCode] = useState('');

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı bilgilerini al
      const userData = await fetchUserInfo(true);
      if (userData) {
        setUserInfo(userData);
        setSchoolCode(userData.OkulKodu || '');
      }

      const today = new Date().toISOString().split('T')[0];
      const teacherId = userData?.OgretmenID;

      if (!teacherId) {
        throw new Error('Öğretmen ID bulunamadı');
      }

      // Bugünün ders programını al
      const scheduleResponse = await api.post('/schedule/getteacher', {
        id: teacherId
      });

      // console.log('📅 Schedule API Response:', scheduleResponse.data);

      let todayLessons = 0;
      let completedLessons = 0;
      let pendingLessons = 0;

      // API response formatını kontrol et
      let scheduleData = [];
      if (scheduleResponse.data) {
        if (Array.isArray(scheduleResponse.data)) {
          scheduleData = scheduleResponse.data;
        } else if (scheduleResponse.data.data && Array.isArray(scheduleResponse.data.data)) {
          scheduleData = scheduleResponse.data.data;
        } else if (scheduleResponse.data.success && scheduleResponse.data.data && Array.isArray(scheduleResponse.data.data)) {
          scheduleData = scheduleResponse.data.data;
        }
      }

      if (scheduleData.length > 0) {
        // Bugünün gününü al
        const todayName = new Date().toLocaleDateString('tr-TR', { weekday: 'long' });
        
        const todayLessonsData = scheduleData.filter(lesson => {
          const lessonDay = lesson.Gun;
          return lessonDay === todayName || lessonDay === todayName.charAt(0).toUpperCase() + todayName.slice(1);
        });
        
        todayLessons = todayLessonsData.length;
        
        // Ders durumlarını hesapla - yoklama kaydına göre
        for (const lesson of todayLessonsData) {
          try {
            const attendanceResponse = await api.post('/teacher/attendance', {
              Sinif: String(lesson.Sinif),
              Tarih: today,
              DersSaati: String(lesson.DersSaati),
              ProgramID: Number(lesson.ProgramID)
            });
            
            if (attendanceResponse.data && Array.isArray(attendanceResponse.data)) {
              // Eğer yoklama verisi varsa (null olmayan durumlar varsa) ders bitirilmiş sayılır
              const hasAttendance = attendanceResponse.data.some(student => 
                student.durum !== null && student.durum !== undefined
              );
              if (hasAttendance) {
                completedLessons++;
              }
            }
          } catch (attendanceError) {
            console.log('❌ Yoklama verisi alınamadı:', attendanceError);
          }
        }
        
        pendingLessons = todayLessons - completedLessons;
      }

      // Ödev verilerini al
      let homeworkGiven = 0;
      try {
        const homeworkResponse = await api.post('/teacher/homework');
        if (homeworkResponse.data && Array.isArray(homeworkResponse.data)) {
          // Bugün verilen ödevleri say
          homeworkGiven = homeworkResponse.data.filter(homework => 
            homework.Tarih === today
          ).length;
        }
      } catch (homeworkError) {
        console.log('❌ Ödev verisi alınamadı:', homeworkError);
      }

      // Sınav verilerini al
      let examsToday = 0;
      try {
        const examResponse = await api.post('/teacher/examget');
        if (examResponse.data && Array.isArray(examResponse.data)) {
          examsToday = examResponse.data.filter(exam => 
            exam.Tarih === today
          ).length;
        }
      } catch (examError) {
        console.log('❌ Sınav verisi alınamadı:', examError);
      }

      // Mesaj verilerini kaldırıldı

      // console.log('📊 Final summary data:', {
      //   todayLessons,
      //   completedLessons,
      //   pendingLessons,
      //   attendanceTaken,
      //   pendingAttendance,
      //   homeworkGiven,
      //   examsToday,
      //   messagesReceived,
      //   messagesSent,
      // });

      setSummaryData({
        todayLessons,
        completedLessons,
        pendingLessons,
        homeworkGiven,
        examsToday,
      });

    } catch (error) {
      console.log('❌ Özet verisi alınırken hata:', error);
      // Hata olsa bile mevcut verileri göster
      setSummaryData({
        todayLessons: 0,
        completedLessons: 0,
        pendingLessons: 0,
        homeworkGiven: 0,
        examsToday: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSummaryData();
    setRefreshing(false);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12) return 'Sabah';
    if (hour < 17) return 'Öğleden Sonra';
    return 'Akşam';
  };

  const getMotivationalMessage = () => {
    const { completedLessons, todayLessons } = summaryData;
    const completionRate = todayLessons > 0 ? (completedLessons / todayLessons) * 100 : 0;
    
    if (completionRate >= 80) return 'Mükemmel! Tüm derslerinizi bitirdiniz! 🌟';
    if (completionRate >= 60) return 'Harika! Derslerinizin çoğunu tamamladınız! 💪';
    if (completionRate >= 40) return 'İyi gidiyorsunuz! Devam edin! 🚀';
    if (completedLessons > 0) return 'Başladınız! Kalan dersleri de tamamlayın! 💫';
    return 'Bugün yeni bir gün! Derslerinizi başlatın! 🌅';
  };

  const StatCard = ({ title, value, icon, color, subtitle, onPress }) => (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.statGradient, { backgroundColor: color + '20' }]}>
        <View style={styles.statContent}>
          <View style={[styles.statIcon, { backgroundColor: color + '30' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View style={styles.statText}>
            <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              {value}
            </Text>
            <Text style={[styles.statTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.statSubtitle, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            Yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1E293B'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
          Bugünün Özeti
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
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
        {/* Welcome Card */}
        <View style={[styles.welcomeCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          <View style={[styles.welcomeGradient, { backgroundColor: isDark ? '#0D1B2A' : '#FFD60A' }]}>
            <View style={styles.welcomeContent}>
              <View style={styles.welcomeLeft}>
                <Text style={[styles.welcomeTitle, { color: isDark ? '#FFFFFF' : '#0D1B2A' }]}>
                  {getCurrentTime()}, {userInfo?.AdSoyad || 'Öğretmen'}! 👋
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                  {getMotivationalMessage()}
                </Text>
              </View>
              <View style={[styles.welcomeIcon, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }]}>
                <Ionicons name="analytics" size={32} color={isDark ? '#94A3B8' : '#64748B'} />
              </View>
            </View>
          </View>
        </View>

        {/* Ders İstatistikleri */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            📚 Bugünün Dersleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam Ders"
              value={summaryData.todayLessons}
              icon="book"
              color="#3B82F6"
              subtitle="Bugün planlanan"
            />
            <StatCard
              title="Bitirilen Dersler"
              value={summaryData.completedLessons}
              icon="checkmark-circle"
              color="#10B981"
              subtitle="Yoklama kaydedilen"
            />
            <StatCard
              title="Bekleyen Dersler"
              value={summaryData.pendingLessons}
              icon="time"
              color="#F59E0B"
              subtitle="Yoklama alınmayan"
            />
          </View>
        </View>

        {/* Diğer Aktiviteler */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            🎯 Diğer Aktiviteler
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Verilen Ödev"
              value={summaryData.homeworkGiven}
              icon="document-text"
              color="#8B5CF6"
              subtitle="Bugün atanan"
            />
            <StatCard
              title="Bugünkü Sınavlar"
              value={summaryData.examsToday}
              icon="school"
              color="#F59E0B"
              subtitle="Planlanan sınavlar"
            />
          </View>
        </View>

        {/* Motivasyon Kartı */}
        <View style={[styles.motivationCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          <View style={[styles.motivationGradient, { backgroundColor: '#10B981' }]}>
            <View style={styles.motivationContent}>
              <Ionicons name="trophy" size={40} color="#FFFFFF" />
              <Text style={styles.motivationTitle}>
                Harika İş Çıkarıyorsunuz! 🏆
              </Text>
              <Text style={styles.motivationSubtitle}>
                Bugünkü performansınız gerçekten etkileyici. Öğrencileriniz şanslı!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeCard: {
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeGradient: {
    borderRadius: 20,
    padding: 24,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    borderRadius: 16,
    padding: 16,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  motivationCard: {
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  motivationGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  motivationContent: {
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
});

export default DailySummary;
