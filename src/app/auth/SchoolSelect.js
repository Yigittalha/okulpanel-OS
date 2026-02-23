import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useNavigation } from "@react-navigation/native";
import { schools } from "../../constants/schools";
import { fetchSchools } from "../../lib/api";
import { SafeAreaView } from "react-native-safe-area-context";

const SchoolSelect = () => {
  const [selected, setSelected] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dynamicSchools, setDynamicSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { updateSchoolCode } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();

  // API'den okul listesini çek
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setLoading(true);
        const apiSchools = await fetchSchools();
        
        if (apiSchools && apiSchools.length > 0) {
          // API'den gelen okulları formatla
          const formattedSchools = apiSchools.map(school => ({
            label: school.okul,
            value: school.domain,
            fotograf: school.fotograf
          }));
          setDynamicSchools(formattedSchools);
        } else {
          // API başarısızsa boş liste kullan
          console.log("📋 API'den okul listesi alınamadı, boş liste gösteriliyor");
          setDynamicSchools([]);
        }
      } catch (error) {
        console.error("❌ Error loading schools:", error);
        // Hata durumunda boş liste kullan
        console.log("📋 Hata durumunda boş liste gösteriliyor");
        setDynamicSchools([]);
      } finally {
        setLoading(false);
      }
    };

    loadSchools();
  }, []);

  const handleSchoolSelect = (school) => {
    setSelected(school.value);
    setSelectedLabel(school.label);
    setSelectedPhoto(school.fotograf || "");
    setIsOpen(false);
  };

  const handleContinue = () => {
    if (!selected) return;
    updateSchoolCode(selected, selectedPhoto);
    navigation.navigate("Login");
  };

  // Demo ile giriş yap fonksiyonu
  const handleDemoLogin = () => {
    // API'den gelen okullar arasında demo'yu bul ve fotoğrafını kullan
    const demoSchool = dynamicSchools.find((s) => s.value === "demo");
    if (demoSchool) {
      updateSchoolCode("demo", demoSchool.fotograf || null);
    } else {
      // Liste henüz gelmediyse güvenli geri dönüş
      updateSchoolCode("demo", null);
    }
    setIsOpen(false);
    navigation.navigate("Login");
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>

      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/okul-panel.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: theme.text }]}>OKUL PANEL</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Eğitim Yönetim Sistemi
        </Text>
      </View>

      <View style={styles.selectionContainer}>
        <Text style={[styles.title, { color: theme.text }]}>
          Okulunuzu Seçiniz
        </Text>

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: theme.input }]}
            onPress={() => setIsOpen(!isOpen)}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownIcon}>🏫</Text>
              <Text style={[styles.dropdownText, { color: theme.inputText }]}>
                {selectedLabel || "Okul seçin..."}
              </Text>
            </View>
            <Text
              style={[
                styles.arrow,
                {
                  color: theme.inputText,
                  transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                },
              ]}
            >
              ▼
            </Text>
          </TouchableOpacity>

          {isOpen && (
            <View
              style={[styles.optionsList, { backgroundColor: theme.input }]}
            >
              <ScrollView style={styles.scrollView} nestedScrollEnabled>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.accent} />
                    <Text style={[styles.loadingText, { color: theme.inputText }]}>
                      Okullar yükleniyor...
                    </Text>
                  </View>
                ) : dynamicSchools.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.inputText }]}>
                      📋 Okul listesi bulunamadı
                    </Text>
                    <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
                      Lütfen internet bağlantınızı kontrol edin
                    </Text>
                  </View>
                ) : (
                  dynamicSchools.map((school) => (
                    <TouchableOpacity
                      key={school.value}
                      style={styles.optionItem}
                      onPress={() => handleSchoolSelect(school)}
                    >
                      <Text style={styles.optionIcon}>🏫</Text>
                      <Text
                        style={[styles.optionText, { color: theme.inputText }]}
                      >
                        {school.label}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { opacity: selected ? 1 : 0.6, backgroundColor: theme.accent },
          ]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={[styles.buttonText, { color: theme.primary }]}>
            {selected ? "➡️ Devam Et" : "📋 Okul Seçin"}
          </Text>
        </TouchableOpacity>

        {/* Demo ile Giriş Yap Butonu */}
        <TouchableOpacity
          style={[
            styles.demoButton,
            { 
              backgroundColor: theme.accent,
              borderColor: 'transparent',
              borderWidth: 0,
              marginTop: 30,
            },
          ]}
          onPress={handleDemoLogin}
          activeOpacity={0.8}
        >
          <Text style={[styles.demoButtonText, { color: theme.primary }]}> 
            🚀 Demo ile Giriş Yap
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    position: "absolute",
    top: 80,
    right: 20,
    zIndex: 1000,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === 'ios' ? 40 : 60, // iPhone için daha az padding
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 15,
  },
  appName: {
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 3,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    letterSpacing: 1,
  },
  selectionContainer: {
    flex: 1.2,
    paddingHorizontal: 30,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, // iPhone için daha az padding
    paddingBottom: Platform.OS === 'ios' ? 20 : 30, // iPhone için alt padding
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  dropdownContainer: {
    marginBottom: 30,
    zIndex: 1000,
  },
  dropdownButton: {
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  arrow: {
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsList: {
    borderRadius: 15,
    marginTop: 8,
    maxHeight: 220,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  scrollView: {
    maxHeight: 220,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  demoButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    minHeight: 50,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  demoButtonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.7,
  },
});

export default SchoolSelect;
