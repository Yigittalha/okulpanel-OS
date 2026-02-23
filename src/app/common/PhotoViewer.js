import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../state/theme';
import { Ionicons } from '@expo/vector-icons';
import { getUploadUrl } from '../../lib/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PhotoViewer = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { images, selectedIndex = 0, schoolCode } = route.params || {};
  
  const [currentImageIndex, setCurrentImageIndex] = useState(selectedIndex);
  const scrollViewRef = useRef(null);

  if (!images || images.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            Görüntülenecek dosya bulunamadı
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: theme.primary }]}>
              Geri Dön
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentImage = images[currentImageIndex];
  const isPDF = currentImage && typeof currentImage === 'string' && currentImage.toLowerCase().endsWith('.pdf');

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      scrollViewRef.current?.scrollTo({ x: (currentImageIndex - 1) * screenWidth, animated: true });
    }
  };

  const handleNext = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      scrollViewRef.current?.scrollTo({ x: (currentImageIndex + 1) * screenWidth, animated: true });
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentImageIndex(index);
  };

  const openPDFInBrowser = async () => {
    try {
      const pdfUrl = getUploadUrl(currentImage, schoolCode);
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert(
          'Hata',
          'PDF dosyası açılamadı. Lütfen uygun bir PDF okuyucu uygulaması yükleyin.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.log('PDF açma hatası:', error);
      Alert.alert(
        'Hata',
        'PDF dosyası açılırken bir hata oluştu.',
        [{ text: 'Tamam' }]
      );
    }
  };

  const renderPDFPreview = () => (
    <View style={[styles.pdfContainer, { backgroundColor: theme.card }]}>
      <View style={styles.pdfIconContainer}>
        <Ionicons name="document-text" size={80} color={theme.accent} />
      </View>
      <Text style={[styles.pdfTitle, { color: theme.text }]}>
        PDF Dosyası
      </Text>
      <Text style={[styles.pdfName, { color: theme.textSecondary }]} numberOfLines={2}>
        {currentImage}
      </Text>
      <TouchableOpacity
        style={[styles.openPdfButton, { backgroundColor: theme.accent }]}
        onPress={openPDFInBrowser}
      >
        <Ionicons name="open-outline" size={20} color={theme.primary} />
        <Text style={[styles.openPdfButtonText, { color: theme.primary }]}>
          Tarayıcıda Aç
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderImage = () => (
    <Image
      source={{ uri: getUploadUrl(currentImage, schoolCode) }}
      style={styles.image}
      resizeMode="contain"
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {currentImageIndex + 1} / {images.length}
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isPDF ? renderPDFPreview() : renderImage()}
      </View>

      {/* Navigation Controls */}
      {images.length > 1 && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: currentImageIndex === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)' }
            ]}
            onPress={handlePrevious}
            disabled={currentImageIndex === 0}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.5)'
                  }
                ]}
                onPress={() => {
                  setCurrentImageIndex(index);
                  scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: currentImageIndex === images.length - 1 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)' }
            ]}
            onPress={handleNext}
            disabled={currentImageIndex === images.length - 1}
          >
            <Ionicons name="chevron-forward" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  pdfContainer: {
    width: screenWidth * 0.9,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pdfIconContainer: {
    marginBottom: 20,
  },
  pdfTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  pdfName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  openPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  openPdfButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default PhotoViewer;
