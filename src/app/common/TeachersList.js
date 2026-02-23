import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  TextInput,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fetchTeachers, getUploadUrl } from "../../lib/api";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import RefreshableScrollView from "../../components/RefreshableScrollView";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TeacherItem = ({ teacher, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.spring(animation, {
      toValue,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  };

  const arrowRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const getGenderText = (gender) => {
    return gender === true || gender === "1" ? "Erkek" : "Kadın";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.teacherCard, { backgroundColor: theme.card }]}
      onPress={toggleExpand}
    >
      <View style={styles.teacherHeader}>
        <View style={styles.avatarContainer}>
          {teacher.Fotograf && teacher.Fotograf !== "-" ? (
            <Image
              source={{ uri: getUploadUrl(teacher.Fotograf) }}
              style={styles.teacherPhoto}
              defaultSource={require("../../../assets/icon.png")}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              <Text style={styles.avatarText}>
                {getGenderText(teacher.Cinsiyet) === "Erkek" ? "👨‍🏫" : "👩‍🏫"}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.teacherName, { color: theme.text }]}>
            {teacher.AdSoyad}
          </Text>
          <Text style={[styles.teacherDept, { color: theme.textSecondary || theme.text }]}>
            {teacher.Bolum} Öğretmeni
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
          <Text style={[styles.expandIcon, { color: theme.textSecondary || theme.text }]}>▼</Text>
        </Animated.View>
      </View>

      {expanded && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary || theme.text }]}>
                📧 E-posta:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {teacher.Eposta}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary || theme.text }]}>
                📱 Telefon:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {teacher.Telefon}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary || theme.text }]}>
                👤 Cinsiyet:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {getGenderText(teacher.Cinsiyet)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary || theme.text }]}>
                🎂 D. Tarihi:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {formatDate(teacher.DogumTarihi)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary || theme.text }]}>
                🆔 ID:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {teacher.OgretmenID}
              </Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const TeachersList = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 20;
  const { openMenu } = useSlideMenu();
  const [searchText, setSearchText] = useState("");

  const loadTeachers = useCallback(
    async (pageNumber = 1, shouldRefresh = false) => {
      try {
        if (pageNumber === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const data = await fetchTeachers(pageNumber, ITEMS_PER_PAGE);

        if (data && Array.isArray(data)) {
          let newTeachers = data;

          if (shouldRefresh || pageNumber === 1) {
            setTeachers(newTeachers);
            setFilteredTeachers(newTeachers);
          } else {
            // Sayfalama için yeni öğretmenleri ekle
            newTeachers = [...teachers, ...data];
            setTeachers(newTeachers);
            // Arama metni varsa, yeni eklenen öğretmenleri de filtrele
            filterTeachersList(newTeachers, searchText);
          }

          // If we received fewer items than requested, we've reached the end
          setHasMore(data.length === ITEMS_PER_PAGE);
        } else {
          useMockData(pageNumber, shouldRefresh);
        }
      } catch (error) {
        console.error("❌ Error loading teachers:", error);
        useMockData(pageNumber, shouldRefresh);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [teachers, searchText],
  );

  const useMockData = (pageNumber, shouldRefresh) => {
    // Mock data for testing when API fails
    const mockData = [
      {
        OgretmenID: 39,
        AdSoyad: "Ahmet Yılmaz",
        Cinsiyet: true,
        DogumTarihi: "1980-05-14T00:00:00.000Z",
        TCKimlikNo: "10000000001",
        Telefon: "05001112233",
        Eposta: "ahmet.yilmaz@example.com",
        Bolum: "Matematik",
        Fotograf: "default.png",
      },
      {
        OgretmenID: 40,
        AdSoyad: "Mehmet Demir",
        Cinsiyet: true,
        DogumTarihi: "1975-09-21T00:00:00.000Z",
        TCKimlikNo: "10000000002",
        Telefon: "05002223344",
        Eposta: "mehmet.demir@example.com",
        Bolum: "Fizik",
        Fotograf: null,
      },
      {
        OgretmenID: 41,
        AdSoyad: "Ayşe Kaya",
        Cinsiyet: false,
        DogumTarihi: "1988-03-10T00:00:00.000Z",
        TCKimlikNo: "10000000003",
        Telefon: "05003334455",
        Eposta: "ayse.kaya@example.com",
        Bolum: "Kimya",
        Fotograf: null,
      },
    ];

    let newTeachers;
    if (shouldRefresh || pageNumber === 1) {
      setTeachers(mockData);
      setFilteredTeachers(mockData);
    } else {
      // Add mock data with different IDs for pagination testing
      newTeachers = [
        ...teachers,
        ...mockData.map((item, index) => ({
          ...item,
          OgretmenID: 100 + teachers.length + index,
          AdSoyad: `${item.AdSoyad} ${teachers.length + index}`,
        })),
      ];
      setTeachers(newTeachers);
      filterTeachersList(newTeachers, searchText);
    }
    setHasMore(true);
  };

  // Öğretmen verilerini filtreleyen fonksiyon
  const filterTeachersList = (teachersList, query) => {
    if (!teachersList || !teachersList.length) return;

    if (query.trim() === "") {
      setFilteredTeachers(teachersList);
      return;
    }

    const filtered = teachersList.filter(
      (teacher) =>
        teacher.AdSoyad &&
        teacher.AdSoyad.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredTeachers(filtered);
  };

  // Arama metni değiştiğinde öğretmenleri filtrele
  useEffect(() => {
    filterTeachersList(teachers, searchText);
  }, [searchText, teachers]);

  // İlk sayfa yüklendiğinde verileri çek
  useEffect(() => {
    loadTeachers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadTeachers(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTeachers(nextPage);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.accent} />
        <Text
          style={[
            styles.footerText,
            { color: theme.textSecondary || theme.text },
          ]}
        >
          Daha fazla yükleniyor...
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[
        styles.header, 
        { 
          borderBottomColor: theme.border,
          paddingTop: Math.max(insets.top + 10, 35), // Dinamik top padding
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { 
              top: Math.max(insets.top + 15, 35) // Safe area + minimum padding
            }
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Öğretmenler
        </Text>

      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputWrapper,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.searchIcon,
              { color: theme.textSecondary || theme.muted },
            ]}
          >
            🔍
          </Text>
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.text,
              },
            ]}
            placeholder="Aramak istediğiniz öğretmenin adını girin"
            placeholderTextColor={
              theme.textSecondary || theme.muted || theme.text
            }
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchText("")}
            >
              <Text style={{ color: theme.textSecondary || theme.muted }}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Öğretmenler yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTeachers}
          renderItem={({ item }) => (
            <TeacherItem teacher={item} theme={theme} />
          )}
          keyExtractor={(item) => item.OgretmenID.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchText.trim() !== ""
                  ? "Arama kriterine uygun öğretmen bulunamadı."
                  : "Öğretmen bulunamadı."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    padding: 10,
    zIndex: 10,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  teacherCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  teacherHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 12,
  },
  teacherPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  teacherDept: {
    fontSize: 14,
    opacity: 0.7,
  },
  expandIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  infoContainer: {
    paddingTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 10,
  },
  clearButton: {
    padding: 8,
  },
});

export default TeachersList;
