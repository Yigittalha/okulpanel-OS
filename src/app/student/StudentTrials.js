import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../../state/theme";
import api from "../../lib/api";
import StudentBottomMenu from "../../components/StudentBottomMenu";

const { width, height } = Dimensions.get("window");

const StudentTrials = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { OgrenciId, studentName } = route.params || {};
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("Puan");
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);

  const subjects = [
    { key: "MatNet", label: "Matematik Net", color: "#3B82F6" },
    { key: "TurkceNet", label: "Türkçe Net", color: "#10B981" },
    { key: "SosyalNet", label: "Sosyal Net", color: "#F59E0B" },
    { key: "DinNet", label: "Din Net", color: "#8B5CF6" },
    { key: "IngilizceNet", label: "İngilizce Net", color: "#EF4444" },
    { key: "FenNet", label: "Fen Net", color: "#06B6D4" },
    { key: "Puan", label: "Puan", color: "#FFD60A" },
  ];

  useEffect(() => {
    fetchTrials();
  }, []);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      
      let studentId = OgrenciId;
      
      // Eğer OgrenciId route params'tan gelmediyse, kullanıcı bilgilerinden al
      if (!studentId) {
        console.log("🔍 Fetching user info first...");
        const userResponse = await api.post("/user/info", {});
        
        if (!userResponse?.data) {
          Alert.alert("Hata", "Kullanıcı bilgileri alınamadı");
          return;
        }

        console.log("👤 User info received:", userResponse.data);
        studentId = userResponse.data.OgrenciId;
        
        if (!studentId) {
          Alert.alert("Hata", "Öğrenci ID bilgisi bulunamadı");
          return;
        }
      }

      console.log("🔍 Fetching student trials for student ID:", studentId);
      
      const response = await api.post("/trial/student/get", {
        OgrenciId: studentId,
      });

      console.log("📡 Trials API Response received:", response.status);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log("✅ Student trials fetched successfully!");
        console.log("📋 Found", response.data.length, "trial items");
        setTrials(response.data);
      } else {
        console.log("⚠️ No trial data returned");
        setTrials([]);
      }
    } catch (error) {
      console.error("❌ Error fetching student trials:", error);
      Alert.alert("Hata", "Deneme sonuçları yüklenirken bir hata oluştu.");
      setTrials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrials();
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

  const getChartData = () => {
    if (!trials.length) return null;

    // Tarihe göre sırala (eskiye yeniden)
    const sortedTrials = [...trials].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Son 10 denemeyi al
    const recentTrials = sortedTrials.slice(0, 10);
    
    // Grafik için ters çevir (yeniden eskiye)
    const chartTrials = recentTrials.reverse();
    const chartData = chartTrials.map((trial) => {
      if (selectedSubject === "Puan") {
        return (trial.SozelHamPuan || 0) + (trial.SayisalHamPuan || 0);
      }
      return trial[selectedSubject] || 0;
    });
    
    // Min ve max değerleri hesapla
    const minValue = Math.min(...chartData);
    const maxValue = Math.max(...chartData);
    
    // Grafik için padding ekle (min/max değerlerin %10'u kadar)
    const padding = Math.max(Math.abs(maxValue - minValue) * 0.1, 1);
    const chartMin = minValue - padding;
    const chartMax = maxValue + padding;
    
    const data = {
      labels: chartTrials.map(() => ""), // X ekseni tarihlerini gösterme
      datasets: [
        {
          data: chartData,
          color: (opacity = 1) => {
            const subjectColor = subjects.find(s => s.key === selectedSubject)?.color || "#FFD60A";
            // Hex rengi rgba'ya çevir
            const hex = subjectColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          },
          strokeWidth: 3,
        },
      ],
    };

    return { data, chartMin, chartMax };
  };

  const getChartConfig = (chartMin, chartMax) => ({
    backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
    backgroundGradientFrom: isDark ? "#1E293B" : "#FFFFFF",
    backgroundGradientTo: isDark ? "#334155" : "#F8FAFC",
    decimalPlaces: 1,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: subjects.find(s => s.key === selectedSubject)?.color || "#FFD60A",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: isDark ? "#475569" : "#E2E8F0",
    },
    // Y ekseni için min/max değerleri
    fromZero: false,
    yAxisMin: chartMin,
    yAxisMax: chartMax,
  });

  const handleTrialPress = (trial) => {
    navigation.navigate("StudentTrialDetail", {
      trialId: trial.id,
      trialName: trial.name,
      trialDate: trial.date,
      sozelPuan: trial.SozelHamPuan,
      sayisalPuan: trial.SayisalHamPuan,
      OgrenciId: OgrenciId,
    });
  };

  const renderTrialCard = (trial) => (
    <TouchableOpacity
      key={trial.id}
      style={[styles.trialCard, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
      onPress={() => handleTrialPress(trial)}
      activeOpacity={0.7}
    >
      <View style={styles.trialHeader}>
        <View style={[styles.trialIcon, { backgroundColor: isDark ? "#334155" : "#F1F5F9" }]}>
          <Ionicons name="document-text" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
        </View>
        <View style={styles.trialInfo}>
          <Text style={[styles.trialName, { color: isDark ? "#FFFFFF" : "#1E293B" }]}>
            {trial.name}
          </Text>
          <Text style={[styles.trialDate, { color: isDark ? "#94A3B8" : "#64748B" }]}>
            📅 {formatDate(trial.date)}
          </Text>
        </View>
        <View style={styles.trialScores}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Puan
            </Text>
            <Text style={[styles.scoreValue, { color: "#FFD60A", fontWeight: 'bold' }]}>
              {((trial.SozelHamPuan || 0) + (trial.SayisalHamPuan || 0)).toFixed(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.trialAction}>
          <Ionicons name="chevron-forward" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
        </View>
      </View>
    </TouchableOpacity>
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
              {studentName ? `📊 ${studentName} - Deneme Sonuçları` : '📊 Deneme Sonuçlarım'}
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
        {/* Subject Selection */}
        <View style={[styles.subjectSelector, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          <Text style={[styles.selectorTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            Grafik Türü Seçin
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.key}
                style={[
                  styles.subjectButton,
                  { 
                    backgroundColor: selectedSubject === subject.key 
                      ? subject.color 
                      : (isDark ? '#334155' : '#F1F5F9'),
                    borderColor: subject.color,
                  }
                ]}
                onPress={() => setSelectedSubject(subject.key)}
              >
                <Text
                  style={[
                    styles.subjectButtonText,
                    { 
                      color: selectedSubject === subject.key 
                        ? '#FFFFFF' 
                        : (isDark ? '#FFFFFF' : '#1E293B')
                    }
                  ]}
                >
                  {subject.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chart */}
        {trials.length > 0 && (() => {
          const chartDataResult = getChartData();
          if (!chartDataResult) return null;
          
          const { data, chartMin, chartMax } = chartDataResult;
          const chartConfig = getChartConfig(chartMin, chartMax);
          
          return (
            <View style={[styles.chartContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <Text style={[styles.chartTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                {subjects.find(s => s.key === selectedSubject)?.label} Grafiği
              </Text>
              <LineChart
                data={data}
                width={width - 60}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                onDataPointClick={(data) => {
                  console.log("Data point clicked:", data);
                  setSelectedDataPoint(data);
                }}
              />
              
              {/* Seçilen veri noktası bilgisi */}
              {selectedDataPoint && (
                <View style={[styles.dataPointInfo, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                  <Text style={[styles.dataPointTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                    📊 Seçilen Veri
                  </Text>
                  <View style={styles.dataPointContent}>
                    <Text style={[styles.dataPointLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Tarih: {selectedDataPoint.label}
                    </Text>
                    <Text style={[styles.dataPointValue, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                      {subjects.find(s => s.key === selectedSubject)?.label}: {selectedDataPoint.value?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: isDark ? '#475569' : '#E2E8F0' }]}
                    onPress={() => setSelectedDataPoint(null)}
                  >
                    <Ionicons name="close" size={16} color={isDark ? '#FFFFFF' : '#1E293B'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })()}

        {/* Trials List */}
        <View style={styles.trialsSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            📋 Deneme Sonuçları
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Yükleniyor...
              </Text>
            </View>
          ) : trials.length > 0 ? (
            trials.map(renderTrialCard)
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <Ionicons name="document-text-outline" size={48} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Henüz deneme sonucu bulunmuyor
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Alt Menü - Sadece öğrenci için göster */}
      {!OgrenciId && (
        <StudentBottomMenu 
          navigation={navigation} 
          currentRoute="StudentTrials" 
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
  subjectSelector: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  subjectScroll: {
    flexDirection: 'row',
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  subjectButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  trialsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  trialCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trialInfo: {
    flex: 1,
  },
  trialName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trialDate: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  trialScores: {
    flexDirection: 'row',
    gap: 20,
  },
  trialAction: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
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
  dataPointInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataPointTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataPointContent: {
    flex: 1,
    marginLeft: 12,
  },
  dataPointLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dataPointValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default StudentTrials;
