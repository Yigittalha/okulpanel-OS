import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, Text, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import FeaturePageHeader from "../../components/FeaturePageHeader";
import { sendMessage } from "../../lib/api";
import api from "../../lib/api";
import { colors, spacing, typography, radius } from "../../theme/tokens";

const StudentMessage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { conversation } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (conversation?.mesajlar && Array.isArray(conversation.mesajlar)) {
      const cleaned = conversation.mesajlar.map(msg => ({
        ...msg,
        tarih: msg.tarih?.replace('Z', '') || msg.tarih
      }));
      const sorted = [...cleaned].sort((a, b) => {
        return new Date(b.tarih) - new Date(a.tarih);
      });
      setMessages(sorted);
    }
  }, [conversation]);
  

  useEffect(() => {
    if (!global.refreshMessageHandlers) {
      global.refreshMessageHandlers = [];
    }

    const refreshHandler = async () => {
      try {
        const response = await api.post("/student/v2/mesaj/get", {
          id: ""
        });

        if (response.data && Array.isArray(response.data)) {
          const currentAliciID = String(conversation?.AliciID);
          const currentAliciTipi = conversation?.aliciTipi;
          
          const updatedConversation = response.data.find(
            (conv) =>
              String(conv.AliciID) === currentAliciID &&
              conv.aliciTipi === currentAliciTipi
          );

          if (updatedConversation && updatedConversation.mesajlar) {
            const cleaned = updatedConversation.mesajlar.map(msg => ({
              ...msg,
              tarih: msg.tarih?.replace('Z', '') || msg.tarih
            }));
            const sorted = [...cleaned].sort((a, b) => {
              return new Date(b.tarih) - new Date(a.tarih);
            });
            setMessages(sorted);
          }
        }
      } catch (error) {
        console.error("Mesaj güncelleme hatası:", error);
      }
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
  }, [conversation]);

  const isMyMessage = (message) => {
    return String(message.AliciID) === String(conversation.AliciID) ;
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

  const getDateLabel = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (today.getTime() === messageDate.getTime()) return "Bugün";
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (yesterday.getTime() === messageDate.getTime()) return "Dün";
      
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const shouldShowDateLabel = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    try {
      const current = new Date(currentMessage.tarih);
      const previous = new Date(previousMessage.tarih);
      const currentDay = new Date(current.getFullYear(), current.getMonth(), current.getDate());
      const previousDay = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
      
      return currentDay.getTime() !== previousDay.getTime();
    } catch {
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);

      const messageData = {
        mesaj: messageText.trim(),
        gonderenTipi: "student",
        gonderenID: 0,
        aliciTipi: conversation.aliciTipi,
        AliciID: conversation.AliciID,
      };

      const result = await sendMessage(messageData, true);

      if (result) {
        const newMessage = {
          mesaj: messageText.trim(),
          AliciID: conversation.AliciID,
          tarih: new Date().toISOString(),
          AdSoyad: "Ben",
          gonderenID: 0,
        };

        setMessages(prevMessages => [newMessage, ...prevMessages]);
        
        setMessageText("");
        
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMine = isMyMessage(item);
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showDateLabel = shouldShowDateLabel(item, nextMessage);

    return (
      <>
        {showDateLabel && (
          <View style={styles.dateLabelContainer}>
            <View style={styles.dateLabelBadge}>
              <Text style={styles.dateLabelText}>
                {getDateLabel(item.tarih)}
              </Text>
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isMine ? styles.myMessageContainer : styles.theirMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMine ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMine ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.mesaj}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMine ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {formatTime(item.tarih)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const content = (
    <>
      <FeaturePageHeader 
        title={conversation?.adSoyad || "Mesaj"} 
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `msg-${index}`}
        contentContainerStyle={[
          styles.messagesList,
          { paddingTop: spacing.md }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        inverted
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {conversation?.permit === 1 ? (
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.cardBackground,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                color: theme.textPrimary,
                borderColor: colors.border.light,
              },
            ]}
            placeholder="Mesaj yazın..."
            placeholderTextColor={theme.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: messageText.trim() && !sending
                  ? colors.secondary
                  : colors.gray300,
              },
            ]}
            disabled={!messageText.trim() || sending}
            onPress={handleSendMessage}
          >
            <Ionicons
              name="send"
              size={20}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.disabledContainer,
            {
              backgroundColor: theme.cardBackground,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
        >
          <Text style={[styles.disabledText, { color: theme.textTertiary }]}>
            Bu Sohbete Mesaj Gönderemezsiniz
          </Text>
        </View>
      )}
    </>
  );



  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -35 : -45}
    >
      {content}
    </KeyboardAvoidingView>
  );



};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  dateLabelContainer: {
    alignItems: "center",
    marginVertical: spacing.md,
  },
  dateLabelBadge: {
    backgroundColor: colors.gray200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  dateLabelText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  messageContainer: {
    marginBottom: spacing.sm,
    maxWidth: "75%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
    marginLeft: "25%",
  },
  theirMessageContainer: {
    alignSelf: "flex-start",
    marginRight: "25%",
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  myMessageBubble: {
    backgroundColor: colors.secondary,
    borderTopRightRadius: spacing.xs,
  },
  theirMessageBubble: {
    backgroundColor: colors.gray200,
    borderTopLeftRadius: spacing.xs,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    marginBottom: spacing.xs / 2,
  },
  myMessageText: {
    color: colors.primary,
  },
  theirMessageText: {
    color: colors.text.primary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: spacing.xs / 2,
  },
  myMessageTime: {
    color: colors.primary,
    opacity: 0.7,
    textAlign: "right",
  },
  theirMessageTime: {
    color: colors.text.tertiary,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: "center",
  },
  disabledText: {
    fontSize: typography.fontSize.sm,
  },
});

export default StudentMessage;
