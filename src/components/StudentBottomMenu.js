import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const StudentBottomMenu = ({ navigation, currentRoute = 'StudentHomePage' }) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme: currentTheme } = useTheme();

  // Ana menü - 4 temel tab
  const menuItems = [
    {
      id: 'homepage',
      title: 'Ana Sayfa',
      icon: 'home-outline',
      activeIcon: 'home',
      route: 'StudentHomePage',
      color: '#FFD60A',
      category: 'main'
    },
    {
      id: 'homework',
      title: 'Ödevlerim',
      icon: 'document-text-outline',
      activeIcon: 'document-text',
      route: 'StudentHomeworkList',
      color: '#3B82F6',
      category: 'main'
    },
    {
      id: 'messages',
      title: 'Mesajlarım',
      icon: 'chatbubble-outline',
      activeIcon: 'chatbubble',
      route: 'StudentMessageList',
      color: '#10B981',
      category: 'main'
    },
    {
      id: 'profile',
      title: 'Profil',
      icon: 'person-outline',
      activeIcon: 'person',
      route: 'ParentDashboard',
      color: '#8B5CF6',
      category: 'profile'
    },
  ];

  // Her menü öğesi için animasyon değerleri
  const menuAnimations = useRef(
    menuItems.map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      iconScale: new Animated.Value(1),
      textScale: new Animated.Value(1),
    }))
  ).current;

  // Tıklama animasyonu
  const animatePress = (index, callback) => {
    const animation = menuAnimations[index];
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Basma animasyonu
    Animated.parallel([
      Animated.sequence([
        Animated.timing(animation.scale, {
          toValue: 0.9,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animation.scale, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(animation.iconScale, {
          toValue: 1.2,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animation.iconScale, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(animation.textScale, {
          toValue: 1.1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animation.textScale, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (callback) callback();
    });
  };

  const handleMenuPress = (item, index) => {
    try {
      if (item.route && item.route !== currentRoute) {
        animatePress(index, () => {
          if (navigation && navigation.navigate) {
            navigation.navigate(item.route);
          } else {
            console.log('Navigation mevcut değil');
          }
        });
      } else if (!item.route) {
        animatePress(index, () => {
          console.log('Profil tab\'ı henüz aktif değil');
        });
      }
    } catch (error) {
      console.log('Menü tıklama hatası:', error);
    }
  };

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Math.max(insets.bottom, 4),
        backgroundColor: isDark ? currentTheme.background : '#FFFFFF',
        borderTopColor: isDark ? currentTheme.border : '#E2E8F0',
      }
    ]}>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isActive = currentRoute === item.route;
          const animation = menuAnimations[index];
          
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.menuItem,
                {
                  transform: [{ scale: animation.scale }],
                  opacity: animation.opacity,
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => handleMenuPress(item, index)}
                style={styles.menuButton}
                activeOpacity={1}
              >
              <Animated.View style={[
                styles.iconContainer,
                {
                  backgroundColor: isActive ? item.color + '20' : 'transparent',
                  transform: [{ scale: animation.iconScale }],
                }
              ]}>
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={20}
                  color={isActive ? item.color : (isDark ? currentTheme.textSecondary : '#64748B')}
                />
              </Animated.View>
              
              <Animated.Text
                style={[
                  styles.menuTitle,
                  {
                    color: isActive ? item.color : (isDark ? currentTheme.textSecondary : '#64748B'),
                    fontWeight: isActive ? '600' : '400',
                    transform: [{ scale: animation.textScale }],
                  },
                ]}
              >
                {item.title}
              </Animated.Text>
              
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: item.color }]} />
              )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    zIndex: 1004, // Alt menü en üstte
    paddingBottom: 0, // Safe area padding'i kaldırıldı
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 1,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  menuButton: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  menuTitle: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 2,
    borderRadius: 1,
  },
});

export default StudentBottomMenu;
