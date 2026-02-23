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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../state/theme';
import { SessionContext } from '../../state/session';
// import api from '../../lib/api'; // Bu API'ler için token gerekmiyor

const ForgotPasswordEmail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { schoolCode } = useContext(SessionContext);
  const { userType } = route.params;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi giriniz.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    setLoading(true);
    try {
      // Token gerektirmeyen API için doğrudan fetch kullan
      const response = await fetch(`https://${schoolCode}.okulpanel.com.tr/api/user/password/forget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data === "0x399") {
        Alert.alert('Hata', 'Böyle bir e-posta yok');
      } else if (data === true) {
        navigation.navigate('ForgotPasswordVerify', { 
          userType, 
          email 
        });
      } else {
        Alert.alert('Hata', 'Bir şeyler ters gitti, yeniden deneyin');
      }
    } catch (error) {
      console.error('E-posta gönderme hatası:', error);
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

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            E-posta Adresinizi Girin
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {userType === 'teacher' ? 'Öğretmen' : 'Öğrenci'} hesabınız için e-posta adresinizi giriniz
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>
            E-posta Adresi
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.card, 
              color: theme.text,
              borderColor: theme.border 
            }]}
            placeholder="ornek@email.com"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton, 
            { backgroundColor: theme.accent },
            loading && styles.disabledButton
          ]}
          onPress={handleSendEmail}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 30,
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

export default ForgotPasswordEmail;
