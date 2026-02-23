import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  TextInput,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../lib/api";

const TeacherTrialResults = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { schoolCode } = useContext(SessionContext);
  
  const { trialId, trialName } = route.params;
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchResults();
  }, [trialId]);

  useEffect(() => {
    filterResults();
  }, [searchText, results]);

  // Memoized filtered results for performance
  const paginatedResults = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching trial results for ID:", trialId);
      
      const response = await api.post("/trial/result/get", {
        id: trialId
      });
      
      console.log("📡 Trial results API Response received:", response.status);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log("✅ Trial results fetched successfully!");
        console.log("📋 Found", response.data.length, "result items");
        setResults(response.data);
      } else {
        console.log("⚠️ No trial results returned");
        setResults([]);
      }
    } catch (error) {
      console.error("❌ Error fetching trial results:", error);
      console.error("❌ Error message:", error.message);
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
      }
      
      Alert.alert(
        "Hata",
        "Deneme sonuçları yüklenirken bir hata oluştu.",
        [{ text: "Tamam" }]
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filterResults = useCallback(() => {
    if (!searchText.trim()) {
      setFilteredResults(results);
      setCurrentPage(1);
      return;
    }

    const filtered = results.filter(item => 
      item.AdSoyad.toLowerCase().includes(searchText.toLowerCase()) ||
      item.OgrenciNumara.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredResults(filtered);
    setCurrentPage(1);
  }, [searchText, results]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setExpandedItems(new Set());
    await fetchResults();
    setRefreshing(false);
  };

  const loadMoreData = useCallback(() => {
    if (paginatedResults.length < filteredResults.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginatedResults.length, filteredResults.length]);

  const toggleExpanded = useCallback((itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const calculateRank = (index) => {
    return index + 1;
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

  const renderResultItem = ({ item, index }) => {
    const itemKey = `${item.id}-${item.OgrenciNumara}`;
    const isExpanded = expandedItems.has(itemKey);
    
    return (
      <View style={[styles.resultCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        {/* Header - Öğrenci Bilgileri */}
        <TouchableOpacity 
          style={styles.resultHeader}
          onPress={() => toggleExpanded(itemKey)}
          activeOpacity={0.7}
        >
          <View style={styles.rankContainer}>
            <Text style={[styles.rankText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              #{calculateRank(index)}
            </Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={[styles.studentName, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              {item.AdSoyad}
            </Text>
            <Text style={[styles.studentNumber, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {item.OgrenciNumara} • {item.Sinif} • Kitapçık {item.kitapcik}
            </Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.totalScore, { color: '#FFD60A' }]}>
              {item.puan.toFixed(1)}
            </Text>
            <Text style={[styles.totalNet, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {item.toplamNet} Net
            </Text>
          </View>
          <View style={styles.expandIcon}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={isDark ? '#94A3B8' : '#64748B'} 
            />
          </View>
        </TouchableOpacity>

        {/* Öğrencinin Deneme Detayları Butonu */}
        <TouchableOpacity
          style={[styles.studentTrialsButton, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
          onPress={() => navigation.navigate('StudentTrials', { OgrenciId: item.OgrenciId, studentName: item.AdSoyad })}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={20} color={isDark ? '#FFFFFF' : '#1E293B'} />
          <Text style={[styles.studentTrialsButtonText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            Öğrencinin Deneme Detayları
          </Text>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
        </TouchableOpacity>

        {/* Ders Detayları - Açılır Liste */}
        {isExpanded && (
          <View style={styles.subjectsContainer}>
            {[
              { key: 'turkce', net: item.turkceNet, dogru: item.turkceDogru, yanlis: item.turkceYanlis, bos: item.turkceBos },
              { key: 'sosyal', net: item.sosyalNet, dogru: item.sosyalDogru, yanlis: item.sosyalYanlis, bos: item.sosyalBos },
              { key: 'din', net: item.dinNet, dogru: item.dinDogru, yanlis: item.dinYanlis, bos: item.dinBos },
              { key: 'ingilizce', net: item.ingilizceNet, dogru: item.ingilizceDogru, yanlis: item.ingilizceYanlis, bos: item.ingilizceBos },
              { key: 'matematik', net: item.matematikNet, dogru: item.matematikDogru, yanlis: item.matematikYanlis, bos: item.matematikBos },
              { key: 'fen', net: item.fenNet, dogru: item.fenDogru, yanlis: item.fenYanlis, bos: item.fenBos }
            ].map((subject) => (
              <View key={subject.key} style={styles.subjectItem}>
                <View style={styles.subjectHeader}>
                  <View style={[styles.subjectIcon, { backgroundColor: getSubjectColor(subject.key) + '20' }]}>
                    <Text style={[styles.subjectIconText, { color: getSubjectColor(subject.key) }]}>
                      {getSubjectName(subject.key).charAt(0)}
                    </Text>
                  </View>
                  <Text style={[styles.subjectName, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                    {getSubjectName(subject.key)}
                  </Text>
                  <Text style={[styles.subjectNet, { color: getSubjectColor(subject.key) }]}>
                    {subject.net} Net
                  </Text>
                </View>
                <View style={styles.subjectDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={[styles.detailText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {subject.dogru} Doğru
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <Text style={[styles.detailText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {subject.yanlis} Yanlış
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="remove-circle" size={16} color="#F59E0B" />
                    <Text style={[styles.detailText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {subject.bos} Boş
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="school-outline" size={64} color={isDark ? '#64748B' : '#94A3B8'} />
      <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
        Sonuç bulunamadı
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
        {searchText ? 'Arama kriterlerinize uygun sonuç yok' : 'Bu deneme için henüz sonuç yok'}
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
              Deneme Sonuçları
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.statsButton} 
            onPress={() => navigation.navigate('TeacherTrialStatistics', { trialId: trialId, trialName: trialName })}
          >
            <Ionicons name="stats-chart" size={24} color={isDark ? '#FFFFFF' : '#1E293B'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        <Ionicons name="search" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#1E293B' }]}
          placeholder="Öğrenci adı veya numarası ara..."
          placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsCountContainer}>
        <Text style={[styles.resultsCount, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          {filteredResults.length} öğrenci
        </Text>
      </View>

      {/* Content */}
      <FlatList
        data={paginatedResults}
        keyExtractor={(item) => `${item.id}-${item.OgrenciNumara}`}
        renderItem={renderResultItem}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
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
        ListEmptyComponent={!loading ? renderEmptyState : null}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => 
          paginatedResults.length < filteredResults.length ? (
            <View style={styles.loadMoreContainer}>
              <Text style={[styles.loadMoreText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Daha fazla yüklemek için kaydırın...
              </Text>
            </View>
          ) : null
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={20}
        getItemLayout={(data, index) => ({
          length: 120, // Approximate item height
          offset: 120 * index,
          index,
        })}
      />
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
  statsButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  resultsCountContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD60A20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD60A',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  studentNumber: {
    fontSize: 14,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  totalScore: {
    fontSize: 20,
    fontWeight: '800',
  },
  totalNet: {
    fontSize: 12,
    marginTop: 2,
  },
  expandIcon: {
    marginLeft: 12,
  },
  subjectsContainer: {
    marginTop: 16,
    gap: 12,
  },
  subjectItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  subjectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  subjectNet: {
    fontSize: 14,
    fontWeight: '700',
  },
  subjectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
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
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  studentTrialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },
  studentTrialsButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TeacherTrialResults;
