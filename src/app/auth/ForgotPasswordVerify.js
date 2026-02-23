import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../state/theme';
import { SessionContext } from '../../state/session';
// import api from '../../lib/api'; // Bu API'ler için token gerekmiyor

const ForgotPasswordVerify = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { schoolCode } = useContext(SessionContext);
  const { userType, email } = route.params;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef(null);

  // Timer temizleme fonksiyonu
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Timer başlatma fonksiyonu
  const startTimer = () => {
    clearTimer(); // Önce eski timer'ı temizle
    setTimeLeft(120); // Süreyi sıfırla
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          Alert.alert(
            'Süre Doldu',
            'Doğrulama süresi doldu. Lütfen tekrar deneyin.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  clearTimer();
                  navigation.navigate('ForgotPasswordType');
                },
              },
            ]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Component mount olduğunda timer başlat
  useEffect(() => {
    startTimer();
    
    // Cleanup function - component unmount olduğunda timer'ı temizle
    return () => {
      clearTimer();
    };
  }, []);

  // Sayfa focus/blur takibi
  useFocusEffect(
    React.useCallback(() => {
      // Sayfa focus olduğunda timer başlat
      startTimer();
      
      // Sayfa blur olduğunda timer'ı temizle
      return () => {
        clearTimer();
      };
    }, [])
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Alert.alert('Hata', 'Lütfen doğrulama kodunu giriniz.');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Hata', 'Doğrulama kodu 6 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      // Token gerektirmeyen API için doğrudan fetch kullan
      const response = await fetch(`https://${schoolCode}.okulpanel.com.tr/api/user/password/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      
      if (data === false) {
        clearTimer(); // Timer'ı temizle
        Alert.alert('Hata', 'Geçersiz doğrulama kodu');
        navigation.navigate('ForgotPasswordType');
      } else if (data === true) {
        clearTimer(); // Başarılı doğrulama - timer'ı temizle
        navigation.navigate('ForgotPasswordNew', { 
          userType, 
          email,
          code 
        });
      } else {
        clearTimer(); // Hata durumu - timer'ı temizle
        Alert.alert('Hata', 'Bir şeyler ters gitti, yeniden deneyin');
        navigation.navigate('ForgotPasswordType');
      }
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      clearTimer(); // Hata durumu - timer'ı temizle
      Alert.alert('Hata', 'Bir şeyler ters gitti, yeniden deneyin');
      navigation.navigate('ForgotPasswordType');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            clearTimer(); // Geri butonuna basıldığında timer'ı temizle
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: '#000000' }]}>← Geri</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.text }]}>
                Doğrulama Kodunu Girin
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {email} adresine gönderilen 6 haneli doğrulama kodunu giriniz
              </Text>
            </View>

            <View style={styles.timerContainer}>
              <Text style={[styles.timerText, { color: theme.accent }]}>
                Kalan Süre: {formatTime(timeLeft)}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Doğrulama Kodu
              </Text>
              <TextInput
                style={[styles.codeInput, { 
                  backgroundColor: theme.card, 
                  color: theme.text,
                  borderColor: theme.border 
                }]}
                placeholder="123456"
                placeholderTextColor={theme.textSecondary}
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton, 
                { backgroundColor: theme.accent },
                loading && styles.disabledButton
              ]}
              onPress={handleVerifyCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={[styles.continueButtonText, { color: '#000' }]}>
                  Devam Et
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeInput: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButton: {
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ForgotPasswordVerify;
