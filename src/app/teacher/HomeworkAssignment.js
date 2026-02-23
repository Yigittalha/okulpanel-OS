import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DocumentPicker from 'react-native-document-picker';
import api from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";
// useSlideMenu kaldırıldı - özellik sayfalarında slider menü yok
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchAllClasses, fetchSubjects } from "../../lib/api";
import FeaturePageHeader from "../../components/FeaturePageHeader";

const HomeworkAssignment = () => {
  const navigation = useNavigation();
  const { clearSession } = useContext(SessionContext);
  const { theme } = useTheme();
  // openMenu kaldırıldı - özellik sayfalarında slider menü yok
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState({
    DersAdi: "",
    Konu: "",
    Aciklama: "",
    TeslimTarihi: "",
    durum: "",
    OgrenciNumara: "",
    KayitTuru: 1,
    Sinif: "",
    OgretmenID: null,
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  
  // Sınıf seçimi için state'ler
  const [classes, setClasses] = useState([]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [showClassModal, setShowClassModal] = useState(false);
  
  // Ödev türü seçimi için state'ler
  const [homeworkType, setHomeworkType] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  // Ders seçimi için state'ler
  const [subjects, setSubjects] = useState([]);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  
  // Takvim picker için state'ler
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Screen dimensions for responsive dropdown
  const { height } = Dimensions.get("window");
  const MAX_DROPDOWN_HEIGHT = Math.floor(height * 0.5);

  // Get teacher ID on component mount
  useEffect(() => {
    fetchTeacherId();
    fetchClasses();
    fetchSubjectsData();
  }, []);

  const fetchTeacherId = async () => {
    try {
      const response = await api.post(
        "/user/info",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response?.data?.OgretmenID) {
        setTeacherId(response.data.OgretmenID);
        setFormData((prev) => ({
          ...prev,
          OgretmenID: response.data.OgretmenID,
        }));
      }
    } catch (error) {
      console.log("❌ Teacher ID fetch error:", error);
    }
  };

  // Sınıfları API'den çek
  const fetchClasses = async () => {
    try {
      const classesData = await fetchAllClasses();
      if (classesData && classesData.length > 0) {
        setClasses(classesData);
        // İlk sınıfı varsayılan olarak seç
        setSelectedClass(classesData[0].SinifAdi);
        setFormData(prev => ({ ...prev, Sinif: classesData[0].SinifAdi }));
      }
    } catch (error) {
      console.log("❌ Classes fetch error:", error);
    }
  };

  // Dersleri API'den çek
  const fetchSubjectsData = async () => {
    try {
      const subjectsData = await fetchSubjects();
      if (subjectsData && subjectsData.length > 0) {
        setSubjects(subjectsData);
      }
    } catch (error) {
      console.log("❌ Subjects fetch error:", error);
    }
  };

  // File picker function (Multiple Photos + PDFs)
  const pickFile = async () => {
    // Maksimum 4 dosya kontrolü
    if (images.length >= 4) {
      Alert.alert("Uyarı", "Maksimum 4 dosya seçebilirsiniz.");
      return;
    }

    Alert.alert(
      "Dosya Seç",
      "Hangi tür dosya seçmek istiyorsunuz?",
      [
        {
          text: "Fotoğraflar Seç",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: 4 - images.length, // Kalan slot sayısı
                quality: 0.8,
              });

              if (!result.canceled && result.assets) {
                const availableSlots = 4 - images.length;
                const assetsToAdd = result.assets.slice(0, availableSlots);
                
                if (assetsToAdd.length < result.assets.length) {
                  Alert.alert(
                    "Uyarı", 
                    `Maksimum 4 dosya seçebilirsiniz. ${assetsToAdd.length} fotoğraf eklendi, ${result.assets.length - assetsToAdd.length} fotoğraf atlandı.`
                  );
                }
                
                const newImages = assetsToAdd.map(asset => ({
                  uri: asset.uri,
                  name: asset.fileName || `photo_${Date.now()}.jpg`,
                  type: asset.type || 'image/jpeg',
                  size: asset.fileSize
                }));
                
                setImages(prev => [...prev, ...newImages]);
                Alert.alert("Başarılı", `${assetsToAdd.length} fotoğraf seçildi!`);
              }
            } catch (error) {
              console.log("❌ Image picker error:", error);
              Alert.alert("Hata", "Fotoğraflar seçilirken bir hata oluştu.");
            }
          }
        },
        {
          text: "PDF Seç",
          onPress: async () => {
            try {
              const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf],
                allowMultiSelection: true,
                // DocumentPicker'da selectionLimit yok, manuel kontrol yapacağız
              });

              if (result && result.length > 0) {
                const availableSlots = 4 - images.length;
                const filesToAdd = result.slice(0, availableSlots);
                
                if (filesToAdd.length < result.length) {
                  Alert.alert(
                    "Uyarı", 
                    `Maksimum 4 dosya seçebilirsiniz. ${filesToAdd.length} dosya eklendi, ${result.length - filesToAdd.length} dosya atlandı.`
                  );
                }
                
                const newFiles = filesToAdd.map(file => ({
                  uri: file.uri,
                  name: file.name,
                  type: 'application/pdf',
                  size: file.size
                }));
                
                setImages(prev => [...prev, ...newFiles]);
                Alert.alert("Başarılı", `${filesToAdd.length} PDF dosyası seçildi!`);
              }
            } catch (error) {
              if (DocumentPicker.isCancel(error)) {
                return;
              }
              console.log("PDF seçme hatası:", error);
              Alert.alert("Hata", "PDF seçilirken bir hata oluştu.");
            }
          }
        },
        {
          text: "İptal",
          style: "cancel"
        }
      ]
    );
  };

  // Remove file
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove all files
  const removeAllImages = () => {
    setImages([]);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Kayıt türünü otomatik güncelle
    if (field === "OgrenciNumara") {
      const newData = { ...formData, [field]: value };
      newData.KayitTuru = newData.Sinif.trim() ? 0 : 1;
      setFormData(newData);
    } else if (field === "Sinif") {
      const newData = { ...formData, [field]: value };
      newData.KayitTuru = value.trim() ? 0 : 1;
      setFormData(newData);
    }
  };

  // Sınıf seçimi handler'ı
  const handleClassSelect = (className) => {
    setSelectedClass(className);
    setFormData(prev => ({ ...prev, Sinif: className }));
    setIsClassDropdownOpen(false);
  };

  // Ödev türü seçim handler'ı
  const handleTypeSelect = (type) => {
    setHomeworkType(type);
    setIsTypeDropdownOpen(false);
    
    if (type === "Sınıfa Ödev") {
      // Sınıfa ödev seçilirse, eğer sınıf varsa otomatik doldur
      if (classes.length > 0) {
        const firstClass = classes[0].Sinif; // İlk sınıfı seç
        setSelectedClass(firstClass);
        setFormData(prev => ({ 
          ...prev, 
          Sinif: firstClass,
          KayitTuru: 0,
          OgrenciNumara: "" // Öğrenci numarasını temizle
        }));
      }
    } else if (type === "Kişiye Özel Ödev") {
      // Kişiye özel ödev seçilirse sınıf inputunu temizle
      setSelectedClass("");
      setFormData(prev => ({ 
        ...prev, 
        Sinif: "",
        KayitTuru: 1
      }));
    }
  };

  const handleSelectClass = (selectedClass) => {
    setSelectedClass(selectedClass);
    setFormData(prev => ({ ...prev, Sinif: selectedClass }));
    setShowClassModal(false);
  };

  const handleSelectSubject = (selectedSubject) => {
    setSelectedSubject(selectedSubject);
    setFormData(prev => ({ ...prev, DersAdi: selectedSubject }));
    setShowSubjectModal(false);
  };

  // Türkçe tarih formatı için yardımcı fonksiyon
  const formatDateTurkish = (date) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const dayName = days[date.getDay()];
    
    return `${day} ${month} ${year}, ${dayName}`;
  };

  // Tarih seçim handler'ı
  const onDateChange = (event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios'); // iOS'ta sürekli açık kalır
    setSelectedDate(currentDate);
    
    // Tarihi YYYY-MM-DD formatında kaydet (API için)
    const formattedDate = currentDate.toISOString().split('T')[0];
    handleInputChange('TeslimTarihi', formattedDate);
  };

  // Takvim açma fonksiyonu
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Submit homework assignment
  const submitHomework = async () => {
    // Validation
    if (!homeworkType) {
      Alert.alert("Hata", "Ödev türü seçmelisiniz.");
      return;
    }
    if (!formData.DersAdi.trim()) {
      Alert.alert("Hata", "Ders adı gereklidir.");
      return;
    }
    if (!formData.Konu.trim()) {
      Alert.alert("Hata", "Konu gereklidir.");
      return;
    }
    if (!formData.Aciklama.trim()) {
      Alert.alert("Hata", "Açıklama gereklidir.");
      return;
    }
    if (!formData.TeslimTarihi.trim()) {
      Alert.alert("Hata", "Teslim tarihi gereklidir.");
      return;
    }
    
    // Ödev türüne göre özel kontroller
    if (homeworkType === "Kişiye Özel Ödev" && !formData.OgrenciNumara.trim()) {
      Alert.alert("Hata", "Kişiye özel ödev için öğrenci numarası gereklidir.");
      return;
    }
    if (homeworkType === "Sınıfa Ödev" && !formData.Sinif.trim()) {
      Alert.alert("Hata", "Sınıfa ödev için sınıf seçmelisiniz.");
      return;
    }

    try {
      setLoading(true);

      // Create form data for multipart upload
      const formDataToSend = new FormData();

      // Add text fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key].toString());
        }
      });

      // Add files if selected (multiple images/PDFs)
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          const fileToSend = {
            uri: image.uri,
            type: image.type || "image/jpeg",
            name: image.name || `homework_file_${index}.jpg`,
          };
          formDataToSend.append("images", fileToSend);
        });
      }

      // TODO: remove before prod
      // console.log('📤 Homework assignment being sent:', formData);

      const response = await api.post("/teacher/homework", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        console.log("✅ Homework assigned successfully");
        Alert.alert("Başarılı", "Ödev başarıyla atandı!", [
          { text: "Tamam", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.log("❌ Homework assignment error:", error);

      if (error.response?.status === 401) {
        console.log("🔐 Authorization error - clearing session");
        clearSession();
        navigation.navigate("Login");
      } else {
        Alert.alert(
          "Hata",
          "Ödev atanırken bir hata oluştu. Lütfen tekrar deneyin.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Ödev Atama" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Form Fields */}
        <View style={[styles.formCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Ödev Bilgileri
          </Text>

          {/* Ders Adı */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Ders Adı *
            </Text>
            <TouchableOpacity
              style={[
                styles.classSelectButton,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setShowSubjectModal(true)}
            >
              <Text
                style={[
                  styles.classSelectText,
                  {
                    color: selectedSubject ? "#333" : "#7C8DA6",
                  },
                ]}
              >
                {selectedSubject || "Ders seçin..."}
              </Text>
              <Text style={[styles.dropdownIcon, { color: "#7C8DA6" }]}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Konu */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Konu *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor:
                    theme.background === "#f5f5f5" ? "#fff" : theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={formData.Konu}
              onChangeText={(text) => handleInputChange("Konu", text)}
              placeholder="Örn: Kümeler"
              placeholderTextColor={theme.muted}
            />
          </View>

          {/* Açıklama */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Açıklama *
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor:
                    theme.background === "#f5f5f5" ? "#fff" : theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={formData.Aciklama}
              onChangeText={(text) => handleInputChange("Aciklama", text)}
              placeholder="Ödev açıklaması..."
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Teslim Tarihi */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Teslim Tarihi *
            </Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  backgroundColor:
                    theme.background === "#f5f5f5" ? "#fff" : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={showDatepicker}
            >
              <Text
                style={[
                  styles.datePickerText,
                  {
                    color: formData.TeslimTarihi ? theme.text : theme.muted,
                  },
                ]}
              >
                {formData.TeslimTarihi ? formatDateTurkish(new Date(formData.TeslimTarihi)) : "Teslim tarihini seçin"}
              </Text>
              <Text style={[styles.calendarIcon, { color: theme.text }]}>📅</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()} // Bugünden önce seçilemesin
                locale="tr-TR" // Türkçe dil desteği
              />
            )}
          </View>

          {/* Ödev Türü */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Ödev Türü *
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                {
                  backgroundColor:
                    theme.background === "#f5f5f5" ? "#fff" : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  {
                    color: homeworkType ? theme.text : theme.muted,
                  },
                ]}
              >
                {homeworkType || "Ödev türünü seçin..."}
              </Text>
              <Text style={[styles.dropdownArrow, { color: theme.text }]}>
                {isTypeDropdownOpen ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {/* Ödev türü dropdown listesi */}
            {isTypeDropdownOpen && (
              <View
                style={[
                  styles.dropdownList,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleTypeSelect("Sınıfa Ödev")}
                >
                  <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                    🏫 Sınıfa Ödev
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleTypeSelect("Kişiye Özel Ödev")}
                >
                  <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                    👤 Kişiye Özel Ödev
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Öğrenci Numarası - Sadece kişiye özel ödevde göster */}
          {homeworkType === "Kişiye Özel Ödev" && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Öğrenci Numarası *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor:
                      theme.background === "#f5f5f5" ? "#fff" : theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.OgrenciNumara}
                onChangeText={(text) => handleInputChange("OgrenciNumara", text)}
                placeholder="Örn: 12"
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Sınıf - Sadece sınıfa ödevde göster */}
          {homeworkType === "Sınıfa Ödev" && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Sınıf
            </Text>
            <TouchableOpacity
              style={[
                styles.classSelectButton,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setShowClassModal(true)}
            >
              <Text
                style={[
                  styles.classSelectText,
                  {
                    color: selectedClass ? "#333" : "#7C8DA6",
                  },
                ]}
              >
                {selectedClass || "Sınıf seçin..."}
              </Text>
              <Text style={[styles.dropdownIcon, { color: "#7C8DA6" }]}>▼</Text>
            </TouchableOpacity>


          </View>
          )}

          {/* Kayıt Türü Bilgisi */}
          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.infoText,
                {
                  color: "#9CA3AF",
                  backgroundColor: "#9CA3AF20",
                },
              ]}
            >
              📋{" "}
              {formData.KayitTuru === 1
                ? "Öğrenciye Özel Ödev"
                : "Sınıfa Genel Ödev"}
            </Text>
          </View>

        </View>

        {/* File Section */}
        <View style={[styles.formCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📷 Fotoğraf veya PDF Ekle
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            İsteğe Bağlı - Maksimum 4 dosya
          </Text>

          {images.length > 0 ? (
            <View style={styles.imagesContainer}>
              {/* Seçilen dosya sayısı */}
              <View style={styles.filesHeader}>
                <Text style={[styles.filesCount, { color: theme.text }]}>
                  {images.length} dosya seçildi
                </Text>
                <TouchableOpacity
                  style={[styles.removeAllButton, { backgroundColor: theme.danger }]}
                  onPress={removeAllImages}
                >
                  <Text style={[styles.removeAllText, { color: "#fff" }]}>
                    Tümünü Kaldır
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dosya listesi */}
              <FlatList
                data={images}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item.uri}_${index}`}
                renderItem={({ item, index }) => (
                  <View style={styles.imageItem}>
                    {item.type === 'application/pdf' ? (
                      // PDF preview
                      <View style={styles.pdfPreview}>
                        <Text style={[styles.pdfIcon, { color: theme.accent }]}>📄</Text>
                        <Text style={[styles.pdfName, { color: theme.text }]} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {item.size && (
                          <Text style={[styles.pdfSize, { color: theme.muted }]}>
                            {(item.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        )}
                      </View>
                    ) : (
                      // Photo preview
                      <Image source={{ uri: item.uri }} style={styles.photoPreview} />
                    )}
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: theme.danger }]}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={[styles.removeImageText, { color: "#fff" }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />

              {/* Daha fazla dosya ekleme butonu */}
              {images.length < 4 && (
                <TouchableOpacity
                  style={[
                    styles.addMoreButton,
                    {
                      backgroundColor: theme.background === "#f5f5f5" ? "#fff" : theme.surface,
                      borderColor: theme.accent,
                    },
                  ]}
                  onPress={pickFile}
                >
                  <Text style={[styles.addMoreText, { color: theme.accent }]}>
                    ➕ Daha Fazla Ekle ({4 - images.length} kaldı)
                  </Text>
                </TouchableOpacity>
              )}
              
              {images.length >= 4 && (
                <View style={[styles.maxFilesReached, { backgroundColor: theme.muted + "20" }]}>
                  <Text style={[styles.maxFilesText, { color: theme.muted }]}>
                    📁 Maksimum 4 dosya seçildi
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.photoButton,
                {
                  backgroundColor:
                    theme.background === "#f5f5f5" ? "#fff" : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={pickFile}
            >
              <Text style={[styles.photoButtonText, { color: theme.accent }]}>
                📎 Fotoğraf veya PDF Seç
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: theme.accent,
              opacity: loading ? 0.6 : 1,
            },
          ]}
          onPress={submitHomework}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.submitButtonText, { color: "#fff" }]}>
              📝 Ödevi Ata
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Sınıf Seçim Modalı */}
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
                data={classes}
                keyExtractor={(item, index) => item.SinifAdi ? item.SinifAdi : `class-${index}`}
                style={{ maxHeight: MAX_DROPDOWN_HEIGHT }}
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
                    onPress={() => handleSelectClass(item.SinifAdi)}
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

      {/* Ders Seçim Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSubjectModal}
        onRequestClose={() => setShowSubjectModal(false)}
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
              Ders Seç
            </Text>
            {subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: "#7C8DA6" }]}>
                  Ders bulunamadı
                </Text>
              </View>
            ) : (
              <FlatList
                data={subjects}
                keyExtractor={(item, index) => index.toString()}
                style={{ maxHeight: MAX_DROPDOWN_HEIGHT }}
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
                    onPress={() => handleSelectSubject(item.isim)}
                  >
                    <Text style={[styles.classItemText, { color: "#E6EDF3" }]}>
                      {item.isim}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: "#FFD60A" }]}
              onPress={() => setShowSubjectModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: "#0D1B2A" }]}>
                Kapat
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
  // Header stilleri kaldırıldı - FeaturePageHeader kullanılıyor
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Alt boşluk - diğer sayfalar gibi
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
    opacity: 0.7,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
  },
  calendarIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  photoButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  photoContainer: {
    alignItems: "center",
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  pdfPreview: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  pdfIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  pdfName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    maxWidth: 250,
  },
  pdfSize: {
    fontSize: 12,
  },
  removePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removePhotoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  imagesContainer: {
    marginTop: 12,
  },
  filesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filesCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageItem: {
    marginRight: 12,
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removeImageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addMoreButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  maxFilesReached: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  maxFilesText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
  },
  dropdownArrow: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 150,
  },
  dropdownScroll: {
    borderRadius: 8,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  // Modal styles (ExamAdd tarzı)
  classSelectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  classSelectText: {
    fontSize: 16,
  },
  dropdownIcon: {
    fontSize: 16,
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

export default HomeworkAssignment;
