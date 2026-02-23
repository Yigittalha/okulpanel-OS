import React, { useContext, useState, useEffect, useRef } from "react";
import { Animated as RNAnimated } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  SafeAreaView,
  FlatList,
  Dimensions,
} from "react-native";
import { SessionContext } from "../state/session";
import { useTheme } from "../state/theme";
import { useNavigation } from "@react-navigation/native";
import { useSlideMenu } from "./SlideMenuContext";
import { Ionicons } from "@expo/vector-icons";
import { MENU_SCHEMA } from "./menuSchema";

/**
 * Slide Menu Bileşeni - Döngüsel bağımlılıkları önlemek için
 * AppDrawer'dan ayrılmış versiyonu
 */
export default function SlideMenu() {
  const { role, schoolCode, schoolPhoto, clearSession } = useContext(SessionContext);
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { menuVisible, closeMenu, resetMenuState } = useSlideMenu();
  
  // Screen dimensions for responsive design - state ile yönet
  const [screenData, setScreenData] = useState(() => {
    const { height, width } = Dimensions.get("window");
    const MENU_WIDTH = Math.max(Math.floor(width * 0.7), 280); // En az 280px, tercihen %70
    return {
      height,
      width,
      MENU_WIDTH,
      MAX_LIST_HEIGHT: Math.floor(height * 0.5),
      isSmallScreen: height < 700,
    };
  });
  
  const slideAnim = useRef(new RNAnimated.Value(-1000)).current; // Başlangıçta büyük değer

  // İlk mount'ta doğru değeri set et
  useEffect(() => {
    console.log(`🔍 MENU_WIDTH: ${screenData.MENU_WIDTH}px (${Math.round((screenData.MENU_WIDTH/screenData.width)*100)}% of ${screenData.width}px)`);
    slideAnim.setValue(-screenData.MENU_WIDTH);
  }, []);

  // Menü görünürlüğü değiştiğinde animasyonu başlat
  useEffect(() => {
    const targetValue = menuVisible ? 0 : -screenData.MENU_WIDTH;
    RNAnimated.spring(slideAnim, {
      toValue: targetValue,
      useNativeDriver: true,
      friction: 8,
      tension: 65,
    }).start();
    
    // Menü açıldığında accordion state'ini sıfırla ve force refresh
    if (menuVisible) {
      setExpandedCategories(new Set());
      // Force re-render için key değiştir
      setForceRefreshKey(prev => prev + 1);
    }
  }, [menuVisible]);

  // Accordion state for expanded categories
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // Force refresh key - menü her açıldığında arttır
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  const handleLogout = () => {
    console.log('🚀 handleLogout fonksiyonu çağrıldı!');
    Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          console.log('🚀 Alert\'te "Çıkış Yap" seçildi!');
          console.log('🚀 closeMenu() çağrılıyor...');
          closeMenu();
          console.log('🚀 clearSession() çağrılıyor...');
          await clearSession(); // clearSession artık otomatik olarak SlideMenu state'ini temizleyecek
          console.log('🚀 clearSession() tamamlandı!');
        },
      },
    ]);
  };

  const handleNavigate = (screenName) => {
    closeMenu();

    // Öğrenci bilgilerini geçirmek için özel durumlar
    if (
      screenName === "StudentHomeworkList" ||
      screenName === "StudentAbsences"
    ) {
      // Bu sayfalar için öğrenci bilgilerini geçirmek gerekiyor
      // Şimdilik sadece navigate ediyoruz, öğrenci bilgileri sayfa içinde alınacak
      navigation.navigate(screenName);
    } else {
      navigation.navigate(screenName);
    }
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  const getMenuData = () => {
    return MENU_SCHEMA[role] || [];
  };

  // Flatten grouped menu into a single-level list of buttons with special handling for dashboard
  const getFlatMenuItems = () => {
    const categories = getMenuData();
    const flat = [];
    
    // First, add dashboard/home item if it exists
    categories.forEach((cat) => {
      (cat.items || []).forEach((it) => {
        if (it.key === 'dashboard' || it.key === 'anasayfa') {
          flat.unshift({ key: it.key, label: it.label, route: it.route, isHome: true });
        } else {
          flat.push({ key: it.key, label: it.label, route: it.route, isHome: false });
        }
      });
    });
    
    return flat;
  };

  const getItemIcon = (item) => {
    // Basic mapping by common route keys
    const key = item.key || "";
    const map = {
      dashboard: "grid-outline",
      profil: "person-outline",
      "ders-programi": "calendar-outline",
      derslerim: "book-outline",
      ogretmenler: "people-outline",
      ogrenciler: "people-outline",
      yoklama: "notifications-outline",
      "odev-ver": "create-outline",
      sinavlarim: "create-outline",
      notlarim: "bar-chart-outline",
      odevlerim: "clipboard-outline",
      "deneme-sonuclari": "trending-up-outline",
      devamsizlik: "warning-outline",
      "mesaj-gonder": "send-outline",
      "gelen-kutusu": "mail-outline",
    };
    return map[key] || "ellipse-outline";
  };

  const renderMenuItem = ({ item, index }) => {
    const isHome = item.isHome;
    
    return (
      <TouchableOpacity
        style={[
          styles.menuItem,
          {
            backgroundColor: isHome ? theme.accent + '15' : theme.card,
            borderColor: isHome ? theme.accent : theme.border,
            borderWidth: isHome ? 1 : 0,
            marginBottom: isHome ? 12 : 8,
          },
        ]}
        onPress={() => handleNavigate(item.route || item.screen)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.menuIcon, 
          { 
            backgroundColor: isHome ? theme.accent : theme.accent + '20',
            width: isHome ? 40 : 32,
            height: isHome ? 40 : 32,
            borderRadius: isHome ? 20 : 16,
          }
        ]}>
          <Ionicons 
            name={getItemIcon(item)} 
            size={isHome ? 20 : 16} 
            color={isHome ? "#fff" : theme.accent} 
          />
        </View>
        
        <Text
          style={[
            styles.menuText,
            {
              color: isHome ? theme.accent : theme.text,
              fontSize: isHome ? 16 : 14,
              fontWeight: isHome ? '600' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        
        <Ionicons
          name="chevron-forward"
          size={12}
          color={isHome ? theme.accent : (theme.textSecondary || theme.text)}
          style={styles.menuArrow}
        />
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }) => {
    const isExpanded = expandedCategories.has(item.key);

    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryHeader,
            {
              backgroundColor: theme.card,
              minHeight: 44,
              paddingVertical: isSmallScreen ? 10 : 12,
              paddingHorizontal: 14,
            },
          ]}
          onPress={() => toggleCategory(item.key)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.categoryTitle,
                {
                  color: theme.text,
                  fontSize: isSmallScreen ? 15 : 16,
                },
              ]}
            >
              {item.title}
            </Text>
          </View>
          <Text
            style={[
              styles.expandIcon,
              {
                color: theme.text,
                transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
              },
            ]}
          >
            ▼
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.subItemsContainer}>
            {item.items.map((subItem) => (
              <TouchableOpacity
                key={subItem.key}
                style={[
                  styles.subMenuItem,
                  {
                    backgroundColor: theme.card,
                    minHeight: 44,
                    paddingVertical: isSmallScreen ? 8 : 10,
                    paddingHorizontal: 20,
                  },
                ]}
                onPress={() => handleNavigate(subItem.route)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.subMenuLabel,
                    {
                      color: theme.text,
                      fontSize: isSmallScreen ? 13 : 14,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {subItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getRoleTitle = () => {
    switch (role) {
      case "admin":
        return "Admin Paneli";
      case "teacher":
        return "Öğretmen Paneli";
      case "parent":
        return "Veli Paneli";
      default:
        return "Panel";
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={menuVisible}
      onRequestClose={closeMenu}
    >
      <View style={styles.modalOverlay}>
        <RNAnimated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: screenData.MENU_WIDTH,
              paddingTop: 20,
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
              backgroundColor: theme.background,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header Section */}
          <View style={[styles.menuHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.card }]}
              onPress={closeMenu}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>
                ✕
              </Text>
            </TouchableOpacity>

            <Image
              source={schoolPhoto ? { uri: schoolPhoto } : require("../../assets/okul-panel.png")}
              style={styles.menuLogo}
              resizeMode="contain"
            />
            <Text style={[styles.menuTitle, { color: theme.text }]}>
              OKUL PANEL
            </Text>
            <Text style={[styles.roleTitle, { color: theme.text }]}>
              {getRoleTitle()}
            </Text>
            {schoolCode && (
              <View
                style={[styles.schoolBadge, { backgroundColor: theme.accent }]}
              >
                <Text
                  style={[
                    styles.schoolText,
                    { color: isDark ? theme.background : theme.primary },
                  ]}
                >
                  🏫 {schoolCode}
                </Text>
              </View>
            )}
          </View>

          {/* Menu Items - Scrollable */}
          <View style={styles.menuListContainer}>
            <FlatList
              key={`menu-${forceRefreshKey}`}
              data={getFlatMenuItems()}
              keyExtractor={(item) => item.key}
              renderItem={renderMenuItem}
              style={styles.menuList}
              contentContainerStyle={styles.menuListContent}
              showsVerticalScrollIndicator={true}
              scrollIndicatorInsets={{ right: 2 }}
              bounces={true}
              alwaysBounceVertical={false}
              removeClippedSubviews={false}
            />
          </View>

          {/* Fixed Bottom Section */}
          <View style={styles.bottomSection}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[
                styles.logoutButton,
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                console.log('🚀 Çıkış Yap butonuna basıldı!');
                handleLogout();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.logoutIcon, { backgroundColor: "#ff6b6b" }]}>
                <Ionicons name="log-out-outline" size={14} color="#fff" />
              </View>
              
              <Text
                style={[
                  styles.logoutText,
                  { color: "#ff6b6b" },
                ]}
              >
                Çıkış Yap
              </Text>
            </TouchableOpacity>
          </View>
        </RNAnimated.View>

        <TouchableOpacity
          style={[styles.modalBackground, { 
            position: 'absolute',
            left: screenData.MENU_WIDTH,
            right: 0,
            top: 0,
            bottom: 0,
          }]}
          activeOpacity={1}
          onPress={closeMenu}
        />
      </View>
    </Modal>
  );
}

// Placeholder screen - moved from AppDrawer for completeness
export const PlaceholderScreen = ({ title }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.placeholderContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.placeholderText, { color: theme.text }]}>
        {title}
      </Text>
      <Text style={[styles.placeholderSubtext, { color: theme.text }]}>
        Bu özellik geliştirilecek
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  modalBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  slideMenu: {
    paddingTop: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    flex: 1,
  },
  menuHeader: {
    padding: 15,     // ← Daha az padding (25 → 15)
    alignItems: "center",
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuLogo: {
    width: 120,      // ← Biraz büyütüldü (100 → 120)
    height: 120,     // ← Biraz büyütüldü (100 → 120)
    marginBottom: 10, // ← Biraz daha boşluk (8 → 10)
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  roleTitle: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 3,
  },
  schoolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  schoolText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: 4,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 1,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  subItemsContainer: {
    marginLeft: 8,
    marginTop: 2,
  },
  subMenuItem: {
    borderRadius: 8,
    marginVertical: 1,
    marginLeft: 8,
  },
  subMenuLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 2,
    marginHorizontal: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontWeight: "500",
  },
  menuArrow: {
    opacity: 0.5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
  },
  logoutIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  menuListContainer: {
    flex: 1,
    paddingHorizontal: 4,
    marginTop: 10,
    marginBottom: 10,
  },
  menuList: {
    flex: 1,
  },
  menuListContent: {
    paddingVertical: 8,
    paddingBottom: 16,
  },
  bottomSection: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: 10,
  },
  spacer: {
    height: 20, // Add some space between menu items and the logout button
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
});
