import React from "react";
import { View, Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Universal container that handles device-specific safe areas
 * Works on all Android/iOS devices with different navigation types
 */
const SafeContainer = ({ children, style, useHeader = false }) => {
  const insets = useSafeAreaInsets();
  const { height, width } = Dimensions.get("window");
  
  // Dynamic padding calculation based on device characteristics
  const getBottomPadding = () => {
    const baseBottom = insets.bottom || 0;
    
    // Screen aspect ratio check (tall screens need more padding)
    const aspectRatio = height / width;
    const isTallScreen = aspectRatio > 2.0;
    
    if (Platform.OS === 'ios') {
      // iOS: Home indicator + extra space
      return Math.max(baseBottom + 20, 60);
    } else {
      // Android: Navigation bar variations
      const extraPadding = isTallScreen ? 40 : 30;
      
      // Different navigation types
      if (baseBottom === 0) {
        // Full screen or gesture navigation
        return 50;
      } else if (baseBottom < 30) {
        // Gesture navigation
        return baseBottom + extraPadding;
      } else {
        // Button navigation
        return baseBottom + 20;
      }
    }
  };
  
  const getTopPadding = () => {
    if (!useHeader) return 0;
    
    const baseTop = insets.top || 0;
    
    if (Platform.OS === 'ios') {
      return Math.max(baseTop, 44); // iOS status bar
    } else {
      return Math.max(baseTop + 10, 35); // Android status bar + extra
    }
  };

  const containerStyle = [
    {
      flex: 1,
      paddingTop: getTopPadding(),
      paddingBottom: getBottomPadding(),
      paddingLeft: Math.max(insets.left, 0),
      paddingRight: Math.max(insets.right, 0),
    },
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
};

export default SafeContainer;
