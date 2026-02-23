import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useNavigation } from "@react-navigation/native";
import api from "../../lib/api";

const TeacherTrials = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { schoolCode } = useContext(SessionContext);
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrials();
  }, []);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching trials...");
      
      const response = await api.post("/trial/get", {});
      
      console.log("📡 Trials API Response received:", response.status);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log("✅ Trials fetched successfully!");
        console.log("📋 Found", response.data.length, "trial items");
        setTrials(response.data);
      } else {
        console.log("⚠️ No trial data returned");
        setTrials([]);
      }
    } catch (error) {
      console.error("❌ Error fetching trials:", error);
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderTrialItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.trialCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('TeacherTrialResults', { trialId: item.id, trialName: item.name })}
    >
      <View style={styles.trialHeader}>
        <View style={styles.trialIconContainer}>
          <Ionicons name="school" size={24} color="#FFD60A" />
        </View>
        <View style={styles.trialInfo}>
          <Text style={[styles.trialName, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            {item.name}
          </Text>
          <Text style={[styles.trialExplanation, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {item.explanation}
          </Text>
        </View>
      </View>
      
      <View style={styles.trialFooter}>
        <View style={styles.trialDateContainer}>
          <Ionicons name="calendar" size={16} color={isDark ? '#94A3B8' : '#64748B'} />
          <Text style={[styles.trialDate, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {formatDate(item.date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="school-outline" size={64} color={isDark ? '#64748B' : '#94A3B8'} />
      <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
        Henüz deneme yok
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
        Deneme sonuçları burada görünecek
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
              Denemeler
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={trials}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTrialItem}
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
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 48,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  trialCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD60A20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trialInfo: {
    flex: 1,
  },
  trialName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  trialExplanation: {
    fontSize: 14,
    lineHeight: 20,
  },
  trialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trialDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trialDate: {
    fontSize: 14,
    marginLeft: 6,
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

export default TeacherTrials;
