import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
// useSlideMenu kaldırıldı - özellik sayfalarında slider menü yok
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeaturePageHeader from "../../components/FeaturePageHeader";
import api from "../../lib/api";

const HomeworkPoints = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { homework } = route.params;
  const { theme } = useTheme();
  // openMenu kaldırıldı - özellik sayfalarında slider menü yok
  const insets = useSafeAreaInsets();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Sayfa yüklendiğinde öğrenci listesini çek
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      const response = await api.post("/teacher/homework/point", {
        id: homework.id,
        KayitTuru: homework.KayitTuru || 0
      });

      if (response.data && Array.isArray(response.data)) {
        setStudents(response.data);
      } else {
        Alert.alert("Hata", "Öğrenci listesi alınamadı.");
      }
    } catch (error) {
      console.log("❌ Students fetch error:", error);
      Alert.alert("Hata", "Öğrenci listesi yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePointChange = (studentId, value) => {
    setStudents(prev => 
      prev.map(student => 
        student.OgrenciId === studentId 
          ? { ...student, puan: value }
          : student
      )
    );
  };

  const handleSelectOption = (option) => {
    if (selectedStudentId) {
      let pointValue;
      switch (option) {
        case "Yaptı":
          pointValue = "100";
          break;
        case "Yarım Yaptı":
          pointValue = "50";
          break;
        case "Yapmadı":
          pointValue = "0";
          break;
        default:
          pointValue = "";
      }
      
      handlePointChange(selectedStudentId, pointValue);
      setShowSelectModal(false);
      setSelectedStudentId(null);
    }
  };

  const openSelectModal = (studentId) => {
    setSelectedStudentId(studentId);
    setShowSelectModal(true);
  };

  const handleSaveAll = async () => {
    try {
      setSavingAll(true);

      // Tüm öğrencileri points dizisine dönüştür
      const points = students.map(student => ({
        odevID: student.id,
        puan: student.puan && student.puan.trim() !== "" ? student.puan : "-1",
        OgrenciID: student.OgrenciId
      }));

      // API çağrısı
      const response = await api.post("/teacher/v2/homework/point/add", {
        points
      });

      if (response.status === 200) {
        Alert.alert("Başarılı", `${points.length} öğrencinin puanı kaydedildi.`);
        navigation.goBack();
      } else {
        Alert.alert("Hata", "Puanlar kaydedilemedi.");
      }
    } catch (error) {
      console.log("❌ Save all points error:", error);
      Alert.alert("Hata", "Puanlar kaydedilirken bir hata oluştu.");
    } finally {
      setSavingAll(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FeaturePageHeader 
          title="Puan Verme" 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Öğrenci listesi yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Puan Verme" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Homework Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.homeworkTitle, { color: theme.text }]}>
            📖 {homework.DersAdi}
          </Text>
          <Text style={[styles.homeworkTopic, { color: "#9CA3AF" }]}>
            📝 {homework.Konu}
          </Text>
          <Text style={[styles.homeworkDate, { color: "#9CA3AF" }]}>
            📅 Teslim: {formatDate(homework.TeslimTarihi)}
          </Text>
        </View>

        {/* Students List */}
        <View style={[styles.studentsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            👥 Öğrenci Listesi
          </Text>

          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Bu ödev için öğrenci bulunamadı.
              </Text>
            </View>
          ) : (
            students.map((student, index) => (
              <View
                key={student.OgrenciId}
                style={[
                  styles.studentItem,
                  { 
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }
                ]}
              >
                {/* Öğrenci Adı ve Numarası - Yan Yana, Sola Yaslı */}
                <View style={styles.studentInfoRow}>
                  <Text style={[styles.studentName, { color: theme.text }]}>
                    {student.AdSoyad}
                  </Text>
                  <Text style={[styles.studentNumber, { color: "#9CA3AF" }]}>
                    No: {student.OgrenciNumara}
                  </Text>
                </View>

                {/* Puan Verme Butonu - Alt, Sola Yaslı */}
                <View style={styles.pointsSection}>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => openSelectModal(student.OgrenciId)}
                  >
                    <Text style={[
                      styles.selectButtonText,
                      { color: student.puan ? theme.text : "#9CA3AF" }
                    ]}>
                      {student.puan === "100" ? "Yaptı" : 
                       student.puan === "50" ? "Yarım Yaptı" : 
                       student.puan === "0" ? "Yapmadı" : "Seçiniz"}
                    </Text>
                    <Text style={[styles.dropdownIcon, { color: theme.muted }]}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Tümünü Kaydet Butonu */}
      <View style={[styles.footerContainer, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[
            styles.saveAllButton,
            {
              backgroundColor: theme.accent,
              opacity: savingAll ? 0.6 : 1,
            }
          ]}
          onPress={handleSaveAll}
          disabled={savingAll}
        >
          {savingAll ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveAllButtonText, { color: "#fff" }]}>
              Tümünü Kaydet
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Select Modal */}
      <Modal
        visible={showSelectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSelectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#11263A", borderColor: "rgba(230,237,243,0.08)" }]}>
            <Text style={[styles.modalTitle, { color: "#E6EDF3" }]}>
              Ödev Durumu Seçin
            </Text>
            
            <TouchableOpacity
              style={[styles.optionButton, { 
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 14,
              }]}
              onPress={() => handleSelectOption("Yaptı")}
            >
              <Text style={[styles.optionText, { color: "#E6EDF3" }]}>Yaptı</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, { 
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 14,
              }]}
              onPress={() => handleSelectOption("Yarım Yaptı")}
            >
              <Text style={[styles.optionText, { color: "#E6EDF3" }]}>Yarım Yaptı</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, { 
                backgroundColor: "#11263A",
                borderColor: "rgba(230,237,243,0.08)",
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 14,
              }]}
              onPress={() => handleSelectOption("Yapmadı")}
            >
              <Text style={[styles.optionText, { color: "#E6EDF3" }]}>Yapmadı</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowSelectModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>Kapat</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  homeworkTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  homeworkTopic: {
    fontSize: 16,
    marginBottom: 4,
  },
  homeworkDate: {
    fontSize: 14,
  },
  studentsCard: {
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontStyle: "italic",
  },
  studentItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  studentInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    justifyContent: "flex-start",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
  },
  studentNumber: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 12,
  },
  pointsSection: {
    width: "100%",
    alignItems: "flex-start",
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  saveAllButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveAllButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectButtonText: {
    fontSize: 14,
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
    marginLeft: 8,
  },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  optionButton: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 1,
  },
  optionText: {
    fontSize: 16,
    color: "#fff",
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

export default HomeworkPoints;
