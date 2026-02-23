import React, { useEffect, useState, useContext, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl, TouchableOpacity, Platform, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api, { fetchUserInfo } from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const DAY_ORDER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default function TeacherScheduleScreen() {
  const { theme } = useTheme();
  const { clearSession } = useContext(SessionContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null); // Açılan gün

  const load = async () => {
    try {
      setError(null);
      setLoading(true);

      const user = await fetchUserInfo(true);
      if (!user?.OgretmenID) {
        throw new Error("Öğretmen ID bulunamadı");
      }

      const res = await api.post("/teacher/schedule", { id: user.OgretmenID });
      const list = Array.isArray(res?.data) ? res.data : [];

      setData(list);
    } catch (e) {
      setError(e?.message || "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sections = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const byDay = data.reduce((acc, item) => {
      const gun = item.Gun || item.gun || item.day || "";
      const key = typeof gun === "string" ? gun : String(gun);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const orderedDays = Object.keys(byDay).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
    return orderedDays.map((d) => ({
      title: d,
      data: byDay[d].sort((a, b) => (a.DersSaati || a.Saat || a.saat || "").localeCompare(b.DersSaati || b.Saat || b.saat || "")),
    }));
  }, [data]);

  // Günler listesi
  const daysList = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const byDay = data.reduce((acc, item) => {
      const gun = item.Gun || item.gun || item.day || "";
      const key = typeof gun === "string" ? gun : String(gun);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.keys(byDay)
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
      .map(day => ({
        day,
        count: byDay[day].length
      }));
  }, [data]);


  const renderLoading = () => (
    <View style={[styles.center, { backgroundColor: theme.background }]}> 
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={[styles.info, { color: theme.text, marginTop: 8 }]}>Yükleniyor...</Text>
    </View>
  );

  const renderError = () => (
    <View style={[styles.center, { backgroundColor: theme.background }]}> 
      <Text style={[styles.error, { color: theme.danger }]}>Hata: {error}</Text>
      <Text style={[styles.link, { color: theme.accent }]} onPress={load}>Tekrar dene</Text>
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
    const dayLessons = data.filter(lesson => (lesson.Gun || lesson.gun || lesson.day || "") === item.day)
      .sort((a, b) => (a.DersSaati || a.Saat || a.saat || "").localeCompare(b.DersSaati || b.Saat || b.saat || ""));

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
        
        {/* Açılan günün dersleri */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {dayLessons.map((lesson, index) => {
              const saat = lesson.DersSaati || lesson.Saat || lesson.saat || "";
              const ders = lesson.Ders || lesson.ders || lesson.DersAdi || "";
              const sinif = lesson.Sinif || lesson.sinif || lesson.SinifAdi || "";
              const ogretmen = lesson.AdSoyad || lesson.ogretmen || lesson.OgretmenAdi || "";
              
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
                        <Ionicons name="layers-outline" size={12} color={theme.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.lessonChipText, { color: theme.text }]} numberOfLines={1}>{sinif}</Text>
                      </View>
                      <View style={[styles.lessonChip, { borderColor: theme.border, backgroundColor: theme.card }]}> 
                        <Ionicons name="person-outline" size={12} color={theme.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.lessonChipText, { color: theme.text }]} numberOfLines={1}>{ogretmen}</Text>
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


  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
    </View>
  );

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  info: { fontSize: 14 },
  error: { fontSize: 14, fontWeight: "600" },
  link: { marginTop: 6, fontSize: 14, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginVertical: 6 },
  rowIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 10 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowTime: { fontSize: 13, fontWeight: "500" },
  rowMetaWrap: { flexDirection: "row", marginTop: 6 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 12, fontWeight: "600" },
  
  // Gün kartı stilleri - Küçültüldü
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,  // ← Küçültüldü (16 → 12)
    paddingHorizontal: 12, // ← Küçültüldü (16 → 12)
    borderRadius: 10,     // ← Küçültüldü (12 → 10)
    borderWidth: 1,
    marginVertical: 4,    // ← Küçültüldü (6 → 4)
  },
  dayIconWrap: {
    width: 40,            // ← Küçültüldü (48 → 40)
    height: 40,           // ← Küçültüldü (48 → 40)
    borderRadius: 10,     // ← Küçültüldü (12 → 10)
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,      // ← Küçültüldü (16 → 12)
  },
  dayContent: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 16,         // ← Küçültüldü (18 → 16)
    fontWeight: "600",    // ← Hafifletildi (700 → 600)
    marginBottom: 2,      // ← Küçültüldü (4 → 2)
  },
  dayCount: {
    fontSize: 13,         // ← Küçültüldü (14 → 13)
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


