import React, { createContext, useEffect, useState } from "react";
import {
  getToken,
  getRefreshToken,
  getRole,
  getUser,
  getSchoolCode,
  getSchoolPhoto,
  setRole,
  setUser,
  setSchoolCode,
  setSchoolPhoto,
  setToken,
  setRefreshToken,
} from "../lib/storage";
import { setSessionClearCallback } from "../lib/api";
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

export const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [session, setSessionState] = useState({
    isAuthenticated: false,
    role: null,
    user: null,
    schoolCode: null,
    schoolPhoto: null,
    loading: true,
  });

  // SlideMenu reset callback'i için ref (state yerine ref kullan - daha stabil)
  const slideMenuResetCallbackRef = React.useRef(null);
  
  const setSlideMenuResetCallback = React.useCallback((callback) => {
    slideMenuResetCallbackRef.current = callback;
  }, []);

  const clearSession = async () => {
    console.log('🚀 clearSession fonksiyonu çağrıldı!');
    
    // SlideMenu state'ini temizle (eğer callback varsa)
    if (slideMenuResetCallbackRef.current) {
      slideMenuResetCallbackRef.current();
    }
    
    // FCM Token silme işlemi
    try {
      console.log('🔔 FCM token alınıyor...');
      
      // FCM token alma işlemini debug et
      console.log('🔍 messaging() kontrol ediliyor...');
      console.log('🔍 messaging().getToken() çağrılıyor...');
      
      const fcmToken = await messaging().getToken();
      console.log('🔍 FCM Token alındı:', fcmToken ? 'Token var' : 'Token yok');
      
      if (fcmToken) {
        console.log('📤 FCM token API\'ye gönderiliyor...');
        console.log('🔍 FCM Token:', fcmToken.substring(0, 20) + '...');
        
        // Bearer token al
        const bearerToken = await getToken();
        console.log('🔍 Bearer Token:', bearerToken ? 'Token var' : 'Token yok');
        
        // Dinamik API URL oluştur
        const schoolCode = await getSchoolCode();
        let apiUrl;
        if (schoolCode && schoolCode !== 'default') {
          apiUrl = `https://${schoolCode}.okulpanel.com.tr/api/user/token/delete`;
        } else {
          apiUrl = 'https://ahuiho.okulpanel.com.tr/api/user/token/delete';
        }
        
        // API'ye POST isteği gönder
        console.log('🌐 API isteği gönderiliyor...');
        console.log('🔍 API URL:', apiUrl);
        
        const response = await axios.post(apiUrl, {
          token: fcmToken
        }, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ FCM token başarıyla silindi:', response.data);
      } else {
        console.log('⚠️ FCM token bulunamadı');
      }
    } catch (error) {
      console.error('❌ FCM token silme hatası:', error);
      console.error('❌ Hata detayı:', error.message);
      console.error('❌ Hata stack:', error.stack);
      // FCM token silme hatası olsa bile çıkış yapmaya devam et
    }
    
    // Eski FCM logout işlemi - user bilgisi varsa
    if (session.user && global.handleFCMLogout) {
      let userId = null;
      if (session.user.OgretmenID) {
        userId = session.user.OgretmenID;
      } else if (session.user.OgrenciId) {
        userId = session.user.OgrenciId;
      } else if (session.user.AdminID) {
        userId = session.user.AdminID;
      }
      
      if (userId) {
        await global.handleFCMLogout(userId);
      }
    }
    
    await Promise.all([
      setToken(null),
      setRefreshToken(null),
      setRole(null),
      setUser(null),
      setSchoolCode(null), // Okul kodunu da temizle
      setSchoolPhoto(null), // Okul fotoğrafını da temizle
    ]);
    setSessionState({
      isAuthenticated: false,
      role: null,
      user: null,
      schoolCode: null, // Okul kodunu state'te de null yap
      schoolPhoto: null, // Okul fotoğrafını state'te de null yap
      loading: false,
    });
  };

  useEffect(() => {
    // Register clear session callback with API interceptor
    setSessionClearCallback(clearSession);

    const restore = async () => {
      const [token, role, user, schoolCode, schoolPhoto] = await Promise.all([
        getToken(),
        getRole(),
        getUser(),
        getSchoolCode(),
        getSchoolPhoto(),
      ]);
      if (token && role) {
        setSessionState({
          isAuthenticated: true,
          role,
          user,
          schoolCode,
          schoolPhoto,
          loading: false,
        });
      } else {
        setSessionState((prev) => ({
          ...prev,
          schoolCode, // Keep schoolCode even if not authenticated
          schoolPhoto, // Keep schoolPhoto even if not authenticated
          loading: false,
        }));
      }
    };
    restore();
  }, []);

  const setSession = async ({
    accessToken,
    refreshToken,
    role,
    user,
    schoolCode,
    schoolPhoto,
  }) => {
    if (accessToken) await setToken(accessToken);
    if (refreshToken) await setRefreshToken(refreshToken);
    if (role) await setRole(role);
    if (user) await setUser(user);
    if (schoolCode) await setSchoolCode(schoolCode);
    if (schoolPhoto !== undefined) await setSchoolPhoto(schoolPhoto);

    // Only set isAuthenticated to true if we have access token and role
    if (accessToken && role) {
      setSessionState({
        isAuthenticated: true,
        role,
        user,
        schoolCode,
        schoolPhoto,
        loading: false,
      });
    } else {
      // If only schoolCode is being set, don't change authentication state
      setSessionState((prev) => ({ ...prev, schoolCode, schoolPhoto }));
    }
  };

  const updateSchoolCode = async (schoolCode, schoolPhoto = null) => {
    await setSchoolCode(schoolCode);
    if (schoolPhoto) {
      await setSchoolPhoto(schoolPhoto);
    } else {
      // Eğer schoolPhoto null ise, eski fotoğrafı da temizle
      await setSchoolPhoto(null);
    }
    setSessionState((prev) => ({ ...prev, schoolCode, schoolPhoto }));
  };

  return (
    <SessionContext.Provider
      value={{ ...session, setSession, updateSchoolCode, clearSession, setSlideMenuResetCallback }}
    >
      {children}
    </SessionContext.Provider>
  );
};
