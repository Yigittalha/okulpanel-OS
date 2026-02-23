import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../state/theme';

const ForgotPasswordType = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleUserTypeSelection = (userType) => {
    if (userType === 'student') {
      navigation.navigate('ForgotPasswordStudentPhone', { userType });
    } else {
      navigation.navigate('ForgotPasswordEmail', { userType });
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
            Kimlik Türünü Seçiniz
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Hangi tür kullanıcısınız?
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Hangi tür kullanıcı olduğunuzu belirlemek için seçim yapınız
          </Text>
        </View>

        <View style={styles.userTypeContainer}>
          <TouchableOpacity
            style={[styles.userTypeButton, { backgroundColor: theme.card }]}
            onPress={() => handleUserTypeSelection("teacher")}
            activeOpacity={0.8}
          >
            <Text style={[styles.userTypeIcon, { color: theme.accent }]}>👩‍🏫</Text>
            <Text style={[styles.userTypeTitle, { color: theme.text }]}>
              Öğretmen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.userTypeButton, { backgroundColor: theme.card }]}
            onPress={() => handleUserTypeSelection("student")}
            activeOpacity={0.8}
          >
            <Text style={[styles.userTypeIcon, { color: theme.accent }]}>👨‍🎓</Text>
            <Text style={[styles.userTypeTitle, { color: theme.text }]}>
              Öğrenci
            </Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  userTypeContainer: {
    gap: 24,
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  userTypeIcon: {
    fontSize: 40,
    marginRight: 24,
  },
  userTypeTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
});

export default ForgotPasswordType;
