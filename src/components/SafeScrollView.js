import React from "react";
import { ScrollView, Platform, Dimensions } from "react-native";

/**
 * A ScrollView component that automatically adds safe bottom padding
 * to prevent content from being hidden behind home indicator or navigation bar
 */
const SafeScrollView = ({ children, contentContainerStyle, ...props }) => {
  const { height } = Dimensions.get("window");
  
  // Dynamic padding based on screen size and platform
  const bottomPadding = Platform.select({
    ios: height > 800 ? 100 : 80, // Büyük iPhone'larda daha fazla
    android: height > 800 ? 80 : 60, // Büyük Android'lerde daha fazla
  });

  const safeContentContainerStyle = [
    {
      paddingBottom: bottomPadding,
    },
    contentContainerStyle,
  ];

  return (
    <ScrollView
      contentContainerStyle={safeContentContainerStyle}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

export default SafeScrollView;
