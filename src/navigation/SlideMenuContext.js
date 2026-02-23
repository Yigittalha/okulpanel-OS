import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { SessionContext } from "../state/session";

// SlideMenu için Context API oluşturalım
const SlideMenuContext = createContext();

/**
 * SlideMenu durum yönetimi için context provider
 * Bu şekilde döngüsel bağımlılık olmadan SlideMenu durumunu yönetebiliriz
 */
export const SlideMenuProvider = ({ children }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(null);
  const { setSlideMenuResetCallback } = useContext(SessionContext);

  // SlideMenu'yü açma fonksiyonu
  const openMenu = useCallback((screenName) => {
    setCurrentScreen(screenName);
    setMenuVisible(true);
  }, []);

  // SlideMenu'yü kapatma fonksiyonu
  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  // State'i temizleme fonksiyonu (logout sırasında kullanılacak) - stable reference
  const resetMenuState = useCallback(() => {
    setMenuVisible(false);
    setCurrentScreen(null);
  }, []);

  // SessionContext'e callback'i register et - stable reference ile
  useEffect(() => {
    if (setSlideMenuResetCallback) {
      setSlideMenuResetCallback(() => resetMenuState);
    }
    
    // Cleanup function - component unmount olduğunda callback'i temizle
    return () => {
      if (setSlideMenuResetCallback) {
        setSlideMenuResetCallback(null);
      }
    };
  }, [setSlideMenuResetCallback, resetMenuState]);

  return (
    <SlideMenuContext.Provider
      value={{
        menuVisible,
        currentScreen,
        openMenu,
        closeMenu,
        resetMenuState,
        setMenuVisible,
      }}
    >
      {children}
    </SlideMenuContext.Provider>
  );
};

// SlideMenu durumunu kullanmak için hook
export const useSlideMenu = () => {
  const context = useContext(SlideMenuContext);
  if (!context) {
    throw new Error("useSlideMenu must be used within SlideMenuProvider");
  }
  return context;
};

export default SlideMenuContext;
