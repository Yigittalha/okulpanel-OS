import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeaturePageHeader from "../../components/FeaturePageHeader";
import { Ionicons } from "@expo/vector-icons";
import api from "../../lib/api";
import { fetchTeachers } from "../../lib/api";
import { colors, spacing, typography, radius } from "../../theme/tokens";
import StudentBottomMenu from "../../components/StudentBottomMenu";

const StudentMessageList = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("teachers");
  const [teachers, setTeachers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  useEffect(() => {
    if (!global.refreshMessageHandlers) {
      global.refreshMessageHandlers = [];
    }

    const refreshHandler = () => {
      fetchConversations();
    };

    global.refreshMessageHandlers.push(refreshHandler);

    return () => {
      if (global.refreshMessageHandlers) {
        const index = global.refreshMessageHandlers.indexOf(refreshHandler);
        if (index > -1) {
          global.refreshMessageHandlers.splice(index, 1);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (modalVisible && activeTab === "teachers") {
      fetchTeachersList();
    }
  }, [modalVisible, activeTab]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.post("/student/v2/mesaj/get", {
        id: ""
      });

      if (response.data && Array.isArray(response.data)) {
        const cleaned = response.data.map(conv => ({
          ...conv,
          sonMesajTarih: conv.sonMesajTarih?.replace('Z', '') || conv.sonMesajTarih
        }));
        const sorted = [...cleaned].sort((a, b) => {
          return new Date(b.sonMesajTarih) - new Date(a.sonMesajTarih);
        });
        setConversations(sorted);
      }
    } catch (error) {
      console.error("Konuşmalar alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "";
    }
  };

  const getIcon = (aliciTipi) => {
    if (aliciTipi === "student") return "person";
    if (aliciTipi === "admin") return "shield-checkmark";
    if (aliciTipi === "teacher") return "person";
    return "person";
  };

  const getIconColor = (aliciTipi) => {
    if (aliciTipi === "student") return colors.primary;
    if (aliciTipi === "admin") return colors.secondary;
    if (aliciTipi === "teacher") return colors.primary;
    return colors.primary;
  };

  const fetchTeachersList = async () => {
    try {
      setLoadingTeachers(true);
      const data = await fetchTeachers(1, 1000);
      setTeachers(data?.data || data || []);
    } catch (error) {
      console.error("Öğretmenler alınamadı:", error);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const searchLower = searchText.toLowerCase();
    return teacher.AdSoyad?.toLowerCase().includes(searchLower);
  });

  const handleTeacherPress = (teacher) => {
    const teacherIdString = String(teacher.OgretmenID);
    const existingConversation = conversations.find(
      (conv) => conv.aliciTipi === "teacher" && String(conv.AliciID) === teacherIdString
    );

    if (existingConversation) {
      navigation.navigate("StudentMessage", { conversation: existingConversation });
    } else {
      const newConversation = {
        mesajlar: [],
        adSoyad: teacher.AdSoyad,
        Sinif: "-",
        OgrenciNumara: "-",
        permit: 1,
        aliciTipi: "teacher",
        AliciID: teacherIdString,
        sonMesajOzeti: "-",
        sonMesajTarih: "-",
      };
      navigation.navigate("StudentMessage", { conversation: newConversation });
    }
    setModalVisible(false);
    setSearchText("");
  };

  const handleAdminPress = () => {
    const existingConversation = conversations.find(
      (conv) => conv.aliciTipi === "admin"
    );

    if (existingConversation) {
      navigation.navigate("StudentMessage", { conversation: existingConversation });
    } else {
      const newConversation = {
        mesajlar: [],
        adSoyad: "Okul Yönetimi",
        Sinif: "-",
        OgrenciNumara: "-",
        permit: 1,
        aliciTipi: "admin",
        AliciID: "0",
        sonMesajOzeti: "-",
        sonMesajTarih: "-",
      };
      navigation.navigate("StudentMessage", { conversation: newConversation });
    }
    setModalVisible(false);
    setSearchText("");
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme.cardBackground, borderBottomColor: colors.border.light }]}
      onPress={() => navigation.navigate("StudentMessage", { conversation: item })}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: getIconColor(item.aliciTipi) }]}>
        <Ionicons name={getIcon(item.aliciTipi)} size={24} color={colors.white} />
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.headerRow}>
          <Text style={[styles.adSoyad, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.adSoyad}
          </Text>
          <Text style={[styles.time, { color: theme.textTertiary }]}>
            {formatTime(item.sonMesajTarih)}
          </Text>
        </View>
        <Text style={[styles.sonMesajOzeti, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.sonMesajOzeti || "Mesaj yok"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FeaturePageHeader 
        title="Mesajlar"
        onBackPress={() => navigation.goBack()}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.textSecondary }}>Yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.secondary,
            bottom: insets.bottom + 100,
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color={colors.white} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSearchText("");
        }}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          <View style={[styles.modalHeader, { backgroundColor: theme.cardBackground, paddingTop: insets.top + spacing.md }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setModalVisible(false);
                setSearchText("");
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Yeni Sohbet Başlat
            </Text>
            <View style={styles.backButton} />
          </View>

          <View style={[styles.tabContainer, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "teachers" && [
                  styles.activeTab,
                  { borderBottomColor: colors.secondary },
                ],
                {
                  borderBottomColor:
                    activeTab === "teachers"
                      ? colors.secondary
                      : "transparent",
                },
              ]}
              onPress={() => {
                setActiveTab("teachers");
                setSearchText("");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "teachers"
                        ? colors.secondary
                        : theme.textSecondary,
                    fontWeight:
                      activeTab === "teachers"
                        ? typography.fontWeight.bold
                        : typography.fontWeight.normal,
                  },
                ]}
              >
                Öğretmenler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "admin" && [
                  styles.activeTab,
                  { borderBottomColor: colors.secondary },
                ],
                {
                  borderBottomColor:
                    activeTab === "admin"
                      ? colors.secondary
                      : "transparent",
                },
              ]}
              onPress={() => {
                setActiveTab("admin");
                setSearchText("");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "admin"
                        ? colors.secondary
                        : theme.textSecondary,
                    fontWeight:
                      activeTab === "admin"
                        ? typography.fontWeight.bold
                        : typography.fontWeight.normal,
                  },
                ]}
              >
                Okul Yönetimi
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "teachers" && (
            <View style={styles.tabContent}>
              <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
                <Ionicons name="search" size={20} color={theme.textTertiary} style={styles.searchIcon} />
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="Öğretmen ara..."
                  placeholderTextColor={theme.textTertiary}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              {loadingTeachers ? (
                <View style={styles.modalLoadingContainer}>
                  <Text style={{ color: theme.textSecondary }}>
                    Yükleniyor...
                  </Text>
                </View>
              ) : filteredTeachers.length === 0 ? (
                <View style={styles.modalLoadingContainer}>
                  <Text style={{ color: theme.textSecondary }}>
                    {searchText ? "Sonuç bulunamadı" : "Öğretmen bulunamadı"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredTeachers}
                  keyExtractor={(item, index) =>
                    `teacher-${item.OgretmenID || index}`
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        { 
                          backgroundColor: theme.cardBackground,
                          borderBottomColor: colors.border.light 
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleTeacherPress(item)}
                    >
                      <View style={[styles.listItemAvatar, { backgroundColor: colors.primary }]}>
                        <Ionicons name="person" size={24} color={colors.white} />
                      </View>
                      <View style={styles.listItemContent}>
                        <Text
                          style={[styles.listItemTitle, { color: theme.textPrimary }]}
                          numberOfLines={1}
                        >
                          {item.AdSoyad}
                        </Text>
                        <Text
                          style={[
                            styles.listItemSubtitle,
                            { color: theme.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {item.Bolum}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                  )}
                  style={styles.modalList}
                  contentContainerStyle={styles.modalListContent}
                />
              )}
            </View>
          )}

          {activeTab === "admin" && (
            <View style={styles.tabContent}>
              <TouchableOpacity
                style={[
                  styles.listItem,
                  { 
                    backgroundColor: theme.cardBackground,
                    borderBottomColor: colors.border.light 
                  },
                ]}
                activeOpacity={0.7}
                onPress={handleAdminPress}
              >
                <View style={[styles.listItemAvatar, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.white} />
                </View>
                <View style={styles.listItemContent}>
                  <Text
                    style={[styles.listItemTitle, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    Okul Yönetimi
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <StudentBottomMenu 
        navigation={navigation} 
        currentRoute="StudentMessageList" 
      />
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
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: 80,
  },
  item: {
    flexDirection: "row",
    padding: spacing.md,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs / 2,
  },
  adSoyad: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  sonMesajOzeti: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  time: {
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.sm,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  activeTab: {},
  tabText: {
    fontSize: typography.fontSize.base,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  modalList: {
    flex: 1,
    marginTop: spacing.md,
  },
  modalListContent: {
    paddingBottom: spacing.md,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  listItemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs / 2,
  },
  listItemSubtitle: {
    fontSize: typography.fontSize.sm,
  },
});

export default StudentMessageList;
