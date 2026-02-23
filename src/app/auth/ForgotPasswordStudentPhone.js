import React, { useState, useContext } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../state/theme';
import { SessionContext } from '../../state/session';

const ForgotPasswordStudentPhone = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { schoolCode } = useContext(SessionContext);
  const { userType } = route.params;

  const [phone, setPhone] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text) => {
    // Sadece rakam kabul et ve başında 0 olmasını sağla
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned === '' || cleaned.startsWith('0')) {
      setPhone(cleaned);
    }
  };

  const handleStudentNoChange = (text) => {
    // Sadece rakam kabul et
    const cleaned = text.replace(/[^0-9]/g, '');
    setStudentNo(cleaned);
  };

  const handleSendSMS = async () => {
    if (!phone.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı giriniz.');
      return;
    }

    if (phone.length !== 11) {
      Alert.alert('Hata', 'Telefon numarası 11 haneli olmalıdır.');
      return;
    }

    if (!studentNo.trim()) {
      Alert.alert('Hata', 'Lütfen öğrenci numaranızı giriniz.');
      return;
    }

    setLoading(true);
    try {
      // Token gerektirmeyen API için doğrudan fetch kullan
      const response = await fetch(`https://${schoolCode}.okulpanel.com.tr/api/user/password/student/forget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tel: phone,
          no: studentNo 
        }),
      });
      
      const data = await response.json();
      
      if (data === "0x399") {
        Alert.alert('Hata', 'Telefon numarası veya öğrenci numarası bulunamadı');
      } else if (data === true) {
        navigation.navigate('ForgotPasswordStudentVerify', { 
          userType, 
          phone,
          studentNo 
        });
      } else {
        Alert.alert('Hata', 'Bir şeyler ters gitti, yeniden deneyin');
      }
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      Alert.alert('Hata', 'Bir şeyler ters gitti, yeniden deneyin');
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
          onPress={() => navigation.goBack()}
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
                Telefon Numaranızı Girin
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Öğrenci hesabınız için kayıtlı telefon numaranızı ve öğrenci numaranızı giriniz
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Telefon Numarası
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.card, 
                  color: theme.text,
                  borderColor: theme.border 
                }]}
                placeholder="05551234567"
                placeholderTextColor={theme.textSecondary}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Öğrenci Numarası
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.card, 
                  color: theme.text,
                  borderColor: theme.border 
                }]}
                placeholder="1234"
                placeholderTextColor={theme.textSecondary}
                value={studentNo}
                onChangeText={handleStudentNoChange}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton, 
                { backgroundColor: theme.accent },
                loading && styles.disabledButton
              ]}
              onPress={handleSendSMS}
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
    marginBottom: 40,
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
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  continueButton: {
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 50,
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

export default ForgotPasswordStudentPhone;
