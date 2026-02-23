import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FeaturePageHeader = ({ title, onBackPress, showBackButton = true, rightIcon, onRightIconPress, isInsideSafeArea = false }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { 
      backgroundColor: theme.card,
      borderBottomColor: theme.border,
      paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 16,
    }]}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme.text} 
            />
          </TouchableOpacity>
        )}
        
        <Text style={[styles.title, { 
          color: theme.text,
          marginLeft: showBackButton ? 12 : 0
        }]}>
          {title}
        </Text>

        {rightIcon && (
          <TouchableOpacity 
            style={[styles.rightIconButton, { 
              backgroundColor: theme.accent,
              borderRadius: 20,
              shadowColor: theme.accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }]} 
            onPress={onRightIconPress}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8, // Touch area'yı genişletmek için
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  rightIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4, // Touch area'yı genişletmek için
  },
});

export default FeaturePageHeader;
