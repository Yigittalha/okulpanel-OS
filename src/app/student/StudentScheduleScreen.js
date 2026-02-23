import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import api, { fetchUserInfo } from "../../lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudentBottomMenu from "../../components/StudentBottomMenu";
import FeaturePageHeader from "../../components/FeaturePageHeader";

export default function StudentScheduleScreen() {
  const { theme } = useTheme();
  const { session } = useContext(SessionContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    fetchSchedule();
    return () => { mountedRef.current = false; };
  }, []);

  const fetchSchedule = async () => {
    try {
      const userInfo = await fetchUserInfo(true);
      console.log("🔍 Kullanıcı bilgileri:", userInfo);
      
      if (!userInfo || !userInfo.Sinif) {
        console.log("⚠️ Sınıf bilgisi bulunamadı!");
        setError("Sınıf bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      const sinif = userInfo.Sinif;
      console.log("🔍 Bulunan sınıf:", sinif);

      console.log("📡 Ders programı API çağrısı yapılıyor:", `/schedule/get`, { Sinif: sinif });
      const response = await api.post("/schedule/get", { Sinif: sinif });
      console.log("✅ Schedule API yanıtı:", response);
      
      if (mountedRef.current && response?.data) {
        const grouped = groupByDay(response.data);
        setSchedule(grouped);
        setError(null);
        console.log("📋 Gruplandırılmış veri:", grouped);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("❌ Schedule fetch error:", err);
        setError("Ders programı yüklenemedi");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
  };

  const groupByDay = (data) => {
    const dayOrder = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
    const grouped = {};
    
    data.forEach(item => {
      if (!grouped[item.Gun]) grouped[item.Gun] = [];
      grouped[item.Gun].push(item);
    });

    const startMinutes = (s) => { 
      const [h,m] = s.split("-")[0].split(":").map(Number); 
      return h*60+m; 
    };

    return dayOrder
      .filter(gun => grouped[gun])
      .map(gun => ({
        title: gun,
        data: grouped[gun].sort((a, b) => startMinutes(a.DersSaati) - startMinutes(b.DersSaati))
      }));
  };

  const daysList = schedule.map(day => ({
    day: day.title,
    count: day.data.length,
    data: day.data
  }));

  const renderLoading = () => (
    <View style={[styles.center, { backgroundColor: theme.background }]}> 
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={[styles.info, { color: theme.text, marginTop: 8 }]}>Yükleniyor...</Text>
    </View>
  );

  const renderError = () => (
    <View style={[styles.center, { backgroundColor: theme.background }]}> 
      <Text style={[styles.error, { color: theme.danger }]}>Hata: {error}</Text>
      <Text style={[styles.link, { color: theme.accent }]} onPress={fetchSchedule}>Tekrar dene</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={[styles.center, { backgroundColor: theme.background }]}> 
      <Ionicons name="calendar-outline" size={28} color={theme.muted || theme.text} />
      <Text style={[styles.info, { color: theme.text, marginTop: 6 }]}>Gösterilecek ders programı bulunamadı.</Text>
    </View>
  );

  const renderDayItem = ({ item }) => {
    const isExpanded = expandedDay === item.day;
    
    return (
      <View>
        <TouchableOpacity
          style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => {
            setExpandedDay(isExpanded ? null : item.day);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.dayIconWrap, { backgroundColor: theme.accent + "22" }]}>
            <Ionicons name="calendar-outline" size={24} color={theme.accent} />
          </View>
          <View style={styles.dayContent}>
            <Text style={[styles.dayTitle, { color: theme.text }]}>{item.day}</Text>
            <Text style={[styles.dayCount, { color: theme.muted || theme.text }]}>
              {item.count} ders
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.muted || theme.text} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.data.map((lesson, index) => {
              const saat = lesson.DersSaati || "";
              const ders = lesson.Ders || "";
              const ogretmen = lesson.AdSoyad || "";
              const derslik = lesson.Derslik || "";
              
              return (
                <View key={index} style={[styles.lessonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.lessonIconWrap, { backgroundColor: theme.accent + "22" }]}>
                    <Ionicons name="book-outline" size={16} color={theme.accent} />
                  </View>
                  <View style={styles.lessonContent}>
                    <Text style={[styles.lessonTitle, { color: theme.text }]} numberOfLines={1}>
                      {ders} <Text style={[styles.lessonTime, { color: theme.muted || theme.text }]}>({saat})</Text>
                    </Text>
                    <View style={styles.lessonMetaWrap}>
                      <View style={[styles.lessonChip, { borderColor: theme.border, backgroundColor: theme.card }]}>
                        <Ionicons name="person-outline" size={12} color={theme.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.lessonChipText, { color: theme.text }]} numberOfLines={1}>{ogretmen}</Text>
                      </View>
                      <View style={[styles.lessonChip, { borderColor: theme.border, backgroundColor: theme.card }]}> 
                        <Ionicons name="location-outline" size={12} color={theme.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.lessonChipText, { color: theme.text }]} numberOfLines={1}>{derslik}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Ders Programı" 
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : daysList.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={daysList}
          keyExtractor={(item) => item.day}
          renderItem={renderDayItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: Math.max(insets.bottom + 80, 100) }}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentScheduleScreen" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  info: { fontSize: 14 },
  error: { fontSize: 14, fontWeight: "600" },
  link: { marginTop: 6, fontSize: 14, fontWeight: "600" },
  
  // Gün kartı stilleri
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
  dayIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dayContent: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  dayCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  
  // Açılan içerik stilleri
  expandedContent: {
    marginTop: 8,
    marginBottom: 8,
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 3,
    marginLeft: 16,
  },
  lessonIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  lessonTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  lessonMetaWrap: {
    flexDirection: "row",
    marginTop: 4,
  },
  lessonChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  lessonChipText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
