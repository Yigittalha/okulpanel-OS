import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// ThemeToggle sadece ParentDashboard'da gösterilecek
import { getUploadUrl } from "../../lib/api";
import StudentBottomMenu from "../../components/StudentBottomMenu";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const StudentHomeworkDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { homework } = route.params;
  const { clearSession, schoolCode } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { openMenu } = useSlideMenu();

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  // Teslim tarihine kalan günleri hesapla
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    
    // Sadece tarihi karşılaştır (saat, dakika, saniye hariç)
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Kalan gün durumuna göre renk ve mesaj
  const getDaysRemainingInfo = (daysRemaining) => {
    if (daysRemaining === null) return null;
    
    if (daysRemaining < 0) {
      return {
        text: `${Math.abs(daysRemaining)} gün gecikti`,
        color: "#FF3B30",
        bgColor: "rgba(255, 59, 48, 0.1)",
        icon: "⚠️"
      };
    } else if (daysRemaining === 0) {
      return {
        text: "Bugün son gün!",
        color: "#FF9500",
        bgColor: "rgba(255, 149, 0, 0.1)",
        icon: "⏰"
      };
    } else if (daysRemaining === 1) {
      return {
        text: "Yarın son gün",
        color: "#FF9500",
        bgColor: "rgba(255, 149, 0, 0.1)",
        icon: "📅"
      };
    } else if (daysRemaining <= 3) {
      return {
        text: `${daysRemaining} gün kaldı`,
        color: "#FF9500",
        bgColor: "rgba(255, 149, 0, 0.1)",
        icon: "📅"
      };
    } else if (daysRemaining <= 7) {
      return {
        text: `${daysRemaining} gün kaldı`,
        color: "#34C759",
        bgColor: "rgba(52, 199, 89, 0.1)",
        icon: "✅"
      };
    } else {
      return {
        text: `${daysRemaining} gün kaldı`,
        color: "#007AFF",
        bgColor: "rgba(0, 122, 255, 0.1)",
        icon: "📚"
      };
    }
  };

  const getStatusText = (status, puan) => {
    // Eğer puan verilmişse (null değil ve boş değil), ödev tamamlanmış demektir
    if (puan !== null && puan !== undefined && puan !== "") {
      return "Tamamlandı";
    }
    
    // Puan verilmemişse, orijinal durum koduna göre belirle
    switch (status) {
      case 0:
        return "Bekliyor";
      case 1:
        return "Tamamlandı";
      case 2:
        return "Gecikti";
      default:
        return "Bilinmiyor";
    }
  };

  const getStatusColor = (status, puan) => {
    // Eğer puan verilmişse (null değil ve boş değil), ödev tamamlanmış demektir
    if (puan !== null && puan !== undefined && puan !== "") {
      return "#9CA3AF"; // Tamamlandı - koyu gri
    }
    
    // Puan verilmemişse, orijinal durum koduna göre belirle
    switch (status) {
      case 0:
        return theme.warning;
      case 1:
        return "#9CA3AF"; // Tamamlandı - koyu gri
      case 2:
        return theme.danger;
      default:
        return theme.muted;
    }
  };

  const getHomeworkTypeText = (kayitTuru) => {
    return kayitTuru === 1 ? "Öğrenciye Özel" : "Sınıfa Genel";
  };

  const getHomeworkTypeIcon = (kayitTuru) => {
    return kayitTuru === 1 ? "👤" : "👥";
  };

  // Puan rengini belirle
  const getPointsColor = (points) => {
    if (!points || points === null || points === "") return "#6B7280";
    
    const numericPoints = parseInt(points);
    if (isNaN(numericPoints)) return "#6B7280";
    
    if (numericPoints < 30) return "#EF4444";      // Kırmızı
    if (numericPoints < 50) return "#F59E0B";      // Sarı/Turuncu
    if (numericPoints < 70) return "#FFA500";      // Turuncu
    return "#22C55E";                              // Yeşil (70+)
  };

  // Puan arka plan rengini belirle
  const getPointsBackgroundColor = (points) => {
    if (!points || points === null || points === "") return "#6B728015";
    
    const numericPoints = parseInt(points);
    if (isNaN(numericPoints)) return "#6B728015";
    
    if (numericPoints < 30) return "#EF444415";      // Kırmızı
    if (numericPoints < 50) return "#F59E0B15";      // Sarı/Turuncu
    if (numericPoints < 70) return "#FFA50015";      // Turuncu
    return "#22C55E15";                              // Yeşil (70+)
  };

  // Puan outline rengini belirle
  const getPointsBorderColor = (points) => {
    if (!points || points === null || points === "") return "rgba(107, 114, 128, 0.3)";
    
    const numericPoints = parseInt(points);
    if (isNaN(numericPoints)) return "rgba(107, 114, 128, 0.3)";
    
    if (numericPoints === 100) return "rgba(34, 197, 94, 0.4)";      // Yeşil - Yaptı
    if (numericPoints === 50) return "rgba(245, 158, 11, 0.4)";      // Sarı - Yarım Yaptı
    if (numericPoints === 0) return "rgba(239, 68, 68, 0.4)";        // Kırmızı - Yapmadı
    
    // Diğer puan değerleri için
    if (numericPoints < 30) return "rgba(239, 68, 68, 0.4)";         // Kırmızı
    if (numericPoints < 50) return "rgba(245, 158, 11, 0.4)";        // Sarı/Turuncu
    if (numericPoints < 70) return "rgba(255, 165, 0, 0.4)";         // Turuncu
    return "rgba(34, 197, 94, 0.4)";                                 // Yeşil (70+)
  };

  // Puan değerini yazılı karşılığına çevir
  const getPointsText = (points) => {
    if (!points || points === null || points === "") return "Puan verilmedi";
    
    const numericPoints = parseInt(points);
    if (isNaN(numericPoints)) return "Puan verilmedi";
    
    if (numericPoints === 100) return "Yaptı";
    if (numericPoints === 50) return "Yarım Yaptı";
    if (numericPoints === 0) return "Yapmadı";
    
    // Diğer puan değerleri için sayısal gösterim
    return `${numericPoints} puan`;
  };

  // Fotoğraf verilerini farklı formatlardan al
  const getImages = (homework) => {
    // Yeni format: Array
    if (homework.Fotograf && Array.isArray(homework.Fotograf)) {
      return homework.Fotograf;
    }

    // Eski format: String'i array'e çevir
    if (homework.Fotograf && typeof homework.Fotograf === 'string') {
      return [homework.Fotograf];
    }

    // Backend format: JSON parse et
    if (homework.images) {
      try {
        if (typeof homework.images === 'string') {
          const parsed = JSON.parse(homework.images);
          return Array.isArray(parsed) ? parsed : [];
        }
        if (Array.isArray(homework.images)) {
          return homework.images;
        }
      } catch (error) {
        console.log('JSON parse hatası:', error);
        return [];
      }
    }

    return [];
  };

  const openPhoto = (imageIndex = 0) => {
    const images = getImages(homework);
    if (images.length > 0) {
      navigation.navigate('PhotoViewer', {
        images,
        selectedIndex: imageIndex,
        schoolCode
      });
    }
  };

  const isOverdue = () => {
    if (!homework.TeslimTarihi) return false;
    const dueDate = new Date(homework.TeslimTarihi);
    const today = new Date();
    return dueDate < today && homework.durum !== 1;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader
        title="Ödev Detayı"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
      >
        {/* Status Banner */}
        {isOverdue() && (
          <View
            style={[
              styles.overdueBanner,
              { backgroundColor: theme.danger + "20" },
            ]}
          >
            <Text style={[styles.overdueText, { color: theme.danger }]}>
              ⚠️ Bu ödev teslim tarihi geçmiş!
            </Text>
          </View>
        )}

        {/* Main Info Card */}
        <View style={[styles.mainCard, { backgroundColor: theme.card }]}>
          <View style={styles.subjectRow}>
            <Text style={[styles.subjectText, { color: theme.text }]}>
              📖 {homework.DersAdi}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(homework.durum) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(homework.durum, homework.puan) },
                ]}
              >
                {getStatusText(homework.durum, homework.puan)}
              </Text>
            </View>
          </View>

          <Text style={[styles.topicText, { color: "#9CA3AF" }]}>
            📝 {homework.Konu}
          </Text>

          <View style={styles.typeRow}>
            <Text style={[styles.typeText, { color: "#9CA3AF" }]}>
              {getHomeworkTypeIcon(homework.KayitTuru)}{" "}
              {getHomeworkTypeText(homework.KayitTuru)}
            </Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📋 Açıklama
          </Text>
          <Text
            style={[styles.descriptionText, { color: "#9CA3AF" }]}
          >
            {homework.Aciklama || "Açıklama belirtilmemiş"}
          </Text>
        </View>

        {/* Dates Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📅 Tarihler
          </Text>

          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: "#9CA3AF" }]}>
              Verilme Tarihi:
            </Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>
              {formatDate(homework.tarih)}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: "#9CA3AF" }]}>
              Teslim Tarihi:
            </Text>
            <Text
              style={[
                styles.dateValue,
                {
                  color: isOverdue() ? theme.danger : theme.text,
                },
              ]}
            >
              {formatDate(homework.TeslimTarihi)}
            </Text>
          </View>

          {/* Kalan gün bilgisi */}
          {(() => {
            const daysRemaining = getDaysRemaining(homework.TeslimTarihi);
            const dayInfo = getDaysRemainingInfo(daysRemaining);
            
            if (dayInfo && homework.durum !== 1) { // Tamamlanmamış ödevler için göster
              return (
                <View style={styles.daysRemainingContainer}>
                  <Text style={[styles.dateLabel, { color: theme.muted }]}>
                    Kalan Süre:
                  </Text>
                  <View style={[
                    styles.daysRemainingBadge, 
                    { backgroundColor: dayInfo.bgColor }
                  ]}>
                    <Text style={styles.daysRemainingIcon}>
                      {dayInfo.icon}
                    </Text>
                    <Text style={[
                      styles.daysRemainingText, 
                      { color: dayInfo.color }
                    ]}>
                      {dayInfo.text}
                    </Text>
                  </View>
                </View>
              );
            }
            return null;
          })()}
        </View>

        {/* Additional Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            ℹ️ Ek Bilgiler
          </Text>

          {/* Puan Bilgisi - Vurgulanmış */}
          {homework.puan && homework.puan !== null && homework.puan !== "" ? (
            <View style={[styles.pointsInfoContainer, { backgroundColor: getPointsBackgroundColor(homework.puan), borderColor: getPointsBorderColor(homework.puan) }]}>
              <View style={styles.pointsInfoHeader}>
                <View style={styles.pointsInfoLeft}>
                  <Text style={[styles.pointsInfoIcon, { color: getPointsColor(homework.puan) }]}>
                    {homework.puan === "100" ? "✅" : homework.puan === "50" ? "⚠️" : homework.puan === "0" ? "❌" : "🏆"}
                  </Text>
                  <Text style={[styles.pointsInfoLabel, { color: getPointsColor(homework.puan) }]}>
                    Puan Durumu
                  </Text>
                </View>
                <View style={[styles.pointsBadge, { backgroundColor: getPointsColor(homework.puan) }]}>
                  <Text style={[styles.pointsBadgeText, { color: "#fff" }]}>
                    {getPointsText(homework.puan)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.noPointsContainer, { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" }]}>
              <Text style={[styles.noPointsIcon, { color: "#9CA3AF" }]}>⏳</Text>
              <Text style={[styles.noPointsText, { color: "#9CA3AF" }]}>
                Henüz puan verilmedi
              </Text>
            </View>
          )}
          

          {homework.KayitTuru === 1 ? (
            // Öğrenciye özel ödev - sadece öğrenci numarası
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: "#9CA3AF" }]}>
                Öğrenci No:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {homework.OgrenciNumara || "Belirtilmemiş"}
              </Text>
            </View>
          ) : (
            // Sınıfa genel ödev - sadece sınıf
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: "#9CA3AF" }]}>
                Sınıf:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {homework.Sinif || "Belirtilmemiş"}
              </Text>
            </View>
          )}

        </View>

        {/* Photo Card */}
        {getImages(homework).length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              📷 Ödev Dosyaları ({getImages(homework).length})
            </Text>

            <View style={styles.photoGrid}>
              {getImages(homework).map((image, index) => {
                const isPDF = image && typeof image === 'string' && image.toLowerCase().endsWith('.pdf');
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoGridItem}
                    onPress={() => openPhoto(index)}
                    activeOpacity={0.8}
                  >
                    {isPDF ? (
                      <View style={[styles.pdfGridItem, { backgroundColor: theme.background }]}>
                        <Text style={[styles.pdfGridIcon, { color: theme.accent }]}>📄</Text>
                        <Text style={[styles.pdfGridName, { color: theme.text }]} numberOfLines={2}>
                          {image}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: getUploadUrl(image, schoolCode) }}
                        style={styles.photoGridImage}
                        resizeMode="cover"
                      />
                    )}
                    
                    <View style={[styles.photoGridOverlay, { backgroundColor: theme.background + "80" }]}>
                      <Text style={[styles.photoGridOverlayText, { color: theme.text }]}>
                        👆
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Alt Menü */}
      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentHomeworkDetail" 
      />
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
  placeholder: {
    width: 44, // ThemeToggle yerine boş alan
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overdueBanner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  overdueText: {
    fontSize: 14,
    fontWeight: "600",
  },
  mainCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectText: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  topicText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  typeRow: {
    marginTop: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  daysRemainingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  daysRemainingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  daysRemainingIcon: {
    fontSize: 14,
  },
  daysRemainingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  photoContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    alignItems: "center",
  },
  photoOverlayText: {
    fontSize: 12,
    fontWeight: "500",
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  photoGridItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  pdfGridItem: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  pdfGridIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  pdfGridName: {
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 10,
  },
  photoGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  photoGridOverlayText: {
    fontSize: 16,
  },
  pointsInfoContainer: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pointsInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pointsInfoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pointsInfoLabel: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  pointsBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 80,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pointsBadgeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noPointsContainer: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  noPointsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  noPointsText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default StudentHomeworkDetail;
