import React, { useState, useEffect, useCallback, useContext } from "react";
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
  Linking,
  Alert,
  Platform,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Clipboard,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { fetchAllStudents, getUploadUrl } from "../../lib/api";
import { fetchClassList } from "../../services/classes";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
// useSlideMenu kaldırıldı - özellik sayfalarında slider menü yok
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const StudentItem = ({ student, theme, schoolCode }) => {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.spring(animation, {
      toValue,
      friction: 7,
      tension: 70,
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
    return gender === true || gender === "1" ? "Erkek" : "Kız";
  };

  const makePhoneCall = async (phoneNumber, parentName) => {
    if (!phoneNumber || phoneNumber === "-" || phoneNumber.trim() === "") {
      Alert.alert("Hata", `${parentName} telefon numarası bulunamadı.`);
      return;
    }

    try {
      const phoneUrl = `tel:${phoneNumber.trim()}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Hata", "Telefon arama özelliği desteklenmiyor.");
      }
    } catch (error) {
      Alert.alert("Hata", "Telefon araması başlatılamadı.");
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await Clipboard.setString(text);
      Alert.alert("Kopyalandı", `${label} panoya kopyalandı.`);
    } catch (error) {
      Alert.alert("Hata", "Kopyalama işlemi başarısız oldu.");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.studentCard, { 
        backgroundColor: theme.card || '#FFFFFF',
        shadowColor: theme.text || '#000'
      }]}
      onPress={toggleExpand}
    >
      <View style={styles.cardContent}>
        <View style={styles.mainInfo}>
          <View style={styles.avatarSection}>
            {student.Fotograf && student.Fotograf !== "-" ? (
              <Image
                source={{ uri: getUploadUrl(student.Fotograf, schoolCode) }}
                style={styles.profileImage}
                defaultSource={require("../../../assets/icon.png")}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent || '#2563EB' }]}>
                <Text style={styles.avatarEmoji}>
                  {getGenderText(student.Cinsiyet) === "Erkek" ? "👦" : "👧"}
                </Text>
              </View>
            )}
            <View style={[styles.numberBadge, { backgroundColor: theme.accent || '#2563EB' }]}>
              <Text style={styles.numberText}>{student.OgrenciNumara}</Text>
            </View>
          </View>

          <View style={styles.studentDetails}>
            <Text style={[styles.fullName, { color: theme.text || '#111827' }]}>
              {student.AdSoyad}
            </Text>
            <View style={styles.classInfo}>
              <View style={[styles.classTag, { backgroundColor: (theme.accent || '#2563EB') + '10' }]}>
                <Text style={[styles.classLabel, { color: theme.accent || '#2563EB' }]}>
                  {student.Sinif}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionArea}>
          <Animated.View style={[styles.chevronButton, { transform: [{ rotate: arrowRotation }] }]}>
            <Text style={[styles.chevronIcon, { color: theme.textSecondary || '#6B7280' }]}>▼</Text>
          </Animated.View>
        </View>
      </View>

      {expanded && (
        <View style={[styles.expandedSection, { borderTopColor: theme.border || '#E5E7EB' }]}>
          <View style={styles.detailsContainer}>
            <TouchableOpacity 
              style={[styles.infoItem, { backgroundColor: theme.surface || '#F8FAFC' }]}
              onPress={() => copyToClipboard(student.TCKimlikNo, 'TC Kimlik No')}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoTitle, { color: theme.textSecondary || '#64748B' }]}>
                TC Kimlik No
              </Text>
              <Text style={[styles.infoText, { color: theme.text || '#0F172A' }]}>
                {student.TCKimlikNo}
              </Text>
            </TouchableOpacity>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                👤 Cinsiyet:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {getGenderText(student.Cinsiyet)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                🎂 Doğum Tarihi:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {formatDate(student.DogumTarihi)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                👩 Anne:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {student.AnneAdSoyad}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                👨 Baba:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {student.BabaAdSoyad}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                📞 Anne Tel:
              </Text>
              <View style={styles.phoneRow}>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {student.AnneTel}
                </Text>
                <TouchableOpacity
                  style={[styles.callButton, { backgroundColor: theme.accent || '#2563EB' }]}
                  onPress={() => makePhoneCall(student.AnneTel, "Anne")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.callButtonText}>Ara</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                📞 Baba Tel:
              </Text>
              <View style={styles.phoneRow}>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {student.BabaTel}
                </Text>
                <TouchableOpacity
                  style={[styles.callButton, { backgroundColor: theme.accent || '#2563EB' }]}
                  onPress={() => makePhoneCall(student.BabaTel, "Baba")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.callButtonText}>Ara</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const StudentsList = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { schoolCode } = useContext(SessionContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // openMenu kaldırıldı - özellik sayfalarında slider menü yok
  const [searchText, setSearchText] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [schoolNumber, setSchoolNumber] = useState("");
  const [classes, setClasses] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSchoolNumberModal, setShowSchoolNumberModal] = useState(false);
  const [tempSchoolNumber, setTempSchoolNumber] = useState("");

  // Sınıf listesini çek
  const fetchClasses = useCallback(async () => {
    try {
      const data = await fetchClassList();
      setClasses(data || []);
    } catch (error) {
      console.error("Sınıf verileri alınırken hata:", error);
      Alert.alert("Hata", "Sınıf listesi alınamadı");
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllStudents();

      if (data && Array.isArray(data)) {
        setStudents(data);
        setFilteredStudents(data); // Başlangıçta tüm öğrencileri göster
      } else {
        console.error("❌ API'den veri alınamadı");
        Alert.alert("Hata", "Öğrenci verileri alınamadı");
        setStudents([]);
        setFilteredStudents([]);
      }
    } catch (error) {
      console.error("❌ Error loading students:", error);
      Alert.alert("Hata", "Öğrenci verileri alınırken hata oluştu");
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // searchText'i bağımlılık olarak kaldırdık

  // Arama fonksiyonu - Sadece sınıf ve okul numarası için API çağrısı
  const handleSearch = useCallback(async () => {
    try {
      setIsSearching(true);
      
      // Sadece sınıf ve okul numarası için API çağrısı yap
      const searchParams = {};
      if (selectedClass) searchParams.classId = selectedClass;
      if (schoolNumber.trim()) searchParams.schoolNumber = schoolNumber.trim();

      // Eğer sınıf veya okul numarası seçilmişse API çağrısı yap
      if (Object.keys(searchParams).length > 0) {
        // API çağrısı yap (gerçek endpoint kullanılacak)
        const response = await fetchAllStudents(); // Şimdilik mevcut fonksiyonu kullan
        setFilteredStudents(response || []);
      } else {
        // Sadece isim araması varsa anlık filtreleme kullan
        filterStudents();
      }
    } catch (error) {
      console.error("Arama hatası:", error);
      Alert.alert("Hata", "Arama yapılırken bir hata oluştu");
      setFilteredStudents([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedClass, schoolNumber, filterStudents]);


  // Arama metni, sınıf ve okul numarası değiştiğinde öğrencileri filtrele (anlık arama)
  const filterStudents = useCallback(() => {
    if (!students.length) return; // Öğrenci yoksa işlem yapma

    let filtered = students;

    // Sınıf filtresi
    if (selectedClass && selectedClass.trim() !== "") {
      filtered = filtered.filter(
        (student) => student.Sinif === selectedClass
      );
    }

    // Okul numarası filtresi
    if (schoolNumber && schoolNumber.trim() !== "") {
      filtered = filtered.filter(
        (student) => student.OgrenciNumara === schoolNumber.trim()
      );
    }

    // İsim filtresi
    if (searchText.trim() !== "") {
      filtered = filtered.filter(
        (student) => {
          if (!student.AdSoyad) return false;
          
          const searchTerm = searchText.toLowerCase().trim();
          const fullName = student.AdSoyad.toLowerCase();
          
          // İsim ve soyadı ayır
          const nameParts = fullName.split(' ');
          
          // Her kelimenin o harfle başlayıp başlamadığını kontrol et
          return nameParts.some(part => part.startsWith(searchTerm));
        }
      );
    }

    setFilteredStudents(filtered);
  }, [searchText, selectedClass, schoolNumber, students]);

  // İlk açılışta öğrenci verilerini al
  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  // Öğrenci verisi alındığında filtrelenmiş listeyi de güncelle
  useEffect(() => {
    filterStudents();
  }, [filterStudents]); // filterStudents fonksiyonu değiştiğinde çalışsın

  // Sınıf seçimi değiştiğinde filtreleme yap
  useEffect(() => {
    if (selectedClass) {
      filterStudents();
    }
  }, [selectedClass, filterStudents]);


  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Tüm Öğrenciler" 
        onBackPress={() => navigation.goBack()} 
      />

      {/* Üst Filtre Çubuğu - Sınıf, Okul No, Ara */}
      <View style={styles.topFilterContainer}>
        <View style={styles.topFilterRow}>
          {/* Sınıfa göre buton */}
          <TouchableOpacity
            style={[styles.topFilterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setShowClassModal(true)}
          >
            <Text style={[styles.topFilterButtonText, { color: theme.text }]}>
              {selectedClass ? classes.find(c => c.SinifAdi === selectedClass)?.SinifAdi || selectedClass : "Sınıf Seç"}
            </Text>
            <View style={styles.filterButtonRight}>
              {selectedClass ? (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedClass("");
                    setTimeout(() => {
                      filterStudents();
                    }, 100);
                  }}
                  style={styles.clearFilterButton}
                >
                  <Text style={[styles.clearFilterText, { color: theme.accent }]}>✕</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.topFilterButtonIcon, { color: theme.accent }]}>▼</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Okul No buton */}
          <TouchableOpacity
            style={[styles.topFilterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              setTempSchoolNumber(schoolNumber);
              setShowSchoolNumberModal(true);
            }}
          >
            <Text style={[styles.topFilterButtonText, { color: theme.text }]}>
              {schoolNumber || "Okul No"}
            </Text>
            <View style={styles.filterButtonRight}>
              {schoolNumber ? (
                <TouchableOpacity
                  onPress={() => {
                    setSchoolNumber("");
                    // Okul numarası filtresini temizle ve filtreleme yap
                    setTimeout(() => {
                      if (!students.length) return;
                      
                      let filtered = students;
                      
                      // Sınıf filtresi
                      if (selectedClass && selectedClass.trim() !== "") {
                        filtered = filtered.filter(
                          (student) => student.Sinif === selectedClass
                        );
                      }
                      
                  // İsim filtresi
                  if (searchText.trim() !== "") {
                    filtered = filtered.filter(
                      (student) => {
                        if (!student.AdSoyad) return false;
                        
                        const searchTerm = searchText.toLowerCase().trim();
                        const fullName = student.AdSoyad.toLowerCase();
                        
                        // İsim ve soyadı ayır
                        const nameParts = fullName.split(' ');
                        
                        // Her kelimenin o harfle başlayıp başlamadığını kontrol et
                        return nameParts.some(part => part.startsWith(searchTerm));
                      }
                    );
                  }
                      
                      setFilteredStudents(filtered);
                    }, 100);
                  }}
                  style={styles.clearFilterButton}
                >
                  <Text style={[styles.clearFilterText, { color: theme.accent }]}>✕</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.topFilterButtonIcon, { color: theme.accent }]}>▼</Text>
              )}
            </View>
          </TouchableOpacity>

        </View>
      </View>

      {/* Alt İsim Arama Çubuğu */}
      <View style={styles.bottomSearchContainer}>
        <View style={[styles.bottomSearchWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.searchIconContainer}>
            <Text style={[styles.searchIcon, { color: theme.accent }]}>🔍</Text>
          </View>
          <TextInput
            style={[styles.bottomSearchInput, { color: theme.text }]}
            placeholder="Öğrenci adına göre arama yapın..."
            placeholderTextColor={theme.textSecondary || theme.muted || theme.text}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchText("")}
            >
              <Text style={[styles.clearSearchButtonText, { color: theme.textSecondary }]}>✕</Text>
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
            Öğrenciler yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={({ item }) => (
            <StudentItem student={item} theme={theme} schoolCode={schoolCode} />
          )}
          keyExtractor={(item) => item.OgrenciId.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchText.trim() !== ""
                  ? "Arama kriterine uygun öğrenci bulunamadı."
                  : "Öğrenci bulunamadı."}
              </Text>
            </View>
          }
        />
      )}

      {/* Sınıf Seçimi Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showClassModal}
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                zIndex: 999,
                elevation: 8,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>
              Sınıf Seç
            </Text>
            {classes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: "#7C8DA6" }]}>
                  Sınıf bulunamadı
                </Text>
              </View>
            ) : (
              <FlatList
                data={[
                  { SinifAdi: "Tüm Sınıflar", isAll: true },
                  ...classes
                ]}
                keyExtractor={(item, index) => item.SinifAdi || index.toString()}
                style={{ maxHeight: 300 }}
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.classItem,
                      {
                        backgroundColor: "#11263A",
                        borderColor: "rgba(230,237,243,0.08)",
                        minHeight: 44,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      },
                    ]}
                    onPress={() => {
                      setSelectedClass(item.isAll ? "" : item.SinifAdi);
                      setShowClassModal(false);
                    }}
                  >
                    <Text style={[styles.classItemText, { color: "#E6EDF3" }]}>
                      {item.SinifAdi}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowClassModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>
                Kapat
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Okul Numarası Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSchoolNumberModal}
        onRequestClose={() => setShowSchoolNumberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                zIndex: 999,
                elevation: 8,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>
              Okul Numarası
            </Text>
            
            <View style={styles.modalInputContainer}>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: "#E6EDF3",
                    borderColor: "rgba(230,237,243,0.2)",
                    backgroundColor: "rgba(230,237,243,0.05)"
                  }
                ]}
                placeholder="Okul numarası girin"
                placeholderTextColor="rgba(230,237,243,0.5)"
                value={tempSchoolNumber}
                onChangeText={setTempSchoolNumber}
                keyboardType="numeric"
                autoFocus={true}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => {
                setSchoolNumber(tempSchoolNumber);
                setShowSchoolNumberModal(false);
                // Okul numarası değiştiğinde doğrudan filtreleme yap
                setTimeout(() => {
                  if (!students.length) return;
                  
                  let filtered = students;
                  
                  // Sınıf filtresi
                  if (selectedClass && selectedClass.trim() !== "") {
                    filtered = filtered.filter(
                      (student) => student.Sinif === selectedClass
                    );
                  }
                  
                  // Okul numarası filtresi
                  if (tempSchoolNumber && tempSchoolNumber.trim() !== "") {
                    filtered = filtered.filter(
                      (student) => student.OgrenciNumara === tempSchoolNumber.trim()
                    );
                  }
                  
                  // İsim filtresi
                  if (searchText.trim() !== "") {
                    filtered = filtered.filter(
                      (student) => {
                        if (!student.AdSoyad) return false;
                        
                        const searchTerm = searchText.toLowerCase().trim();
                        const fullName = student.AdSoyad.toLowerCase();
                        
                        // İsim ve soyadı ayır
                        const nameParts = fullName.split(' ');
                        
                        // Her kelimenin o harfle başlayıp başlamadığını kontrol et
                        return nameParts.some(part => part.startsWith(searchTerm));
                      }
                    );
                  }
                  
                  setFilteredStudents(filtered);
                }, 100);
              }}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>
                Seç
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // Header stilleri kaldırıldı - FeaturePageHeader kullanılıyor
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  numberBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  studentDetails: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsContainer: {
    gap: 8,
  },
  infoItem: {
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 2,
  },
  callButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  searchInputWrapper: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    marginRight: 4,
    minHeight: 44,
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
  // Üst filtre stilleri
  topFilterContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  topFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topFilterButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  topFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  topFilterButtonIcon: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  filterButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearFilterButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 12,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFilterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  topSearchButton: {
    minWidth: 120,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    minHeight: 48,
  },
  topSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Alt arama çubuğu stilleri
  bottomSearchContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 15,
  },
  bottomSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  searchIconContainer: {
    marginRight: 12,
    padding: 4,
  },
  searchIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 10,
    fontWeight: '500',
  },
  clearSearchButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  clearSearchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
   // Modal stilleri (ExamAdd'den kopyalandı)
   modalOverlay: {
     flex: 1,
     justifyContent: "center",
     alignItems: "center",
     backgroundColor: "rgba(0, 0, 0, 0.3)",
     zIndex: 999,
   },
   modalContent: {
     width: "70%",
     borderRadius: 12,
     padding: 20,
     maxHeight: "70%",
     borderWidth: 1,
   },
   emptyState: {
     paddingVertical: 20,
     alignItems: "center",
   },
   emptyStateText: {
     fontSize: 16,
     fontStyle: "italic",
   },
   modalTitle: {
     fontSize: 20,
     fontWeight: "bold",
     marginBottom: 20,
     textAlign: "center",
   },
   classItem: {
     paddingVertical: 15,
     borderBottomWidth: 1,
     borderRadius: 8,
     marginVertical: 1,
   },
   classItemText: {
     fontSize: 16,
     color: "#fff", // Metin rengini beyaz yap
   },
   closeModalButton: {
     marginTop: 20,
     borderRadius: 12,
     paddingVertical: 15,
     alignItems: "center",
   },
   closeModalButtonText: {
     fontSize: 16,
     fontWeight: "bold",
     color: "#fff",
   },
});

export default StudentsList;
