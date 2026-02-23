import axios from "axios";
import {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  getSchoolCode,
} from "./storage";



const getApiBaseUrl = async () => {
  const schoolCode = await getSchoolCode();
  if (schoolCode && schoolCode !== 'default') {
    console.log(`https://${schoolCode}.okulpanel.com.tr/api`)
    return `https://${schoolCode}.okulpanel.com.tr/api`;
  }
  return process.env.EXPO_PUBLIC_API || "https://ahuiho.okulpanel.com.tr/api";
};

// Dinamik upload URL fonksiyonu  
const getUploadBaseUrl = async () => {
  const schoolCode = await getSchoolCode();
  if (schoolCode && schoolCode !== 'default') {
    return `https://${schoolCode}.okulpanel.com.tr/uploads`;
  }
  return process.env.EXPO_PUBLIC_FOTO_API || "https://okulpanel.com.tr/uploads";
};

// Başlangıç API URL'si (dinamik olarak güncellenecek)
const API_BASE_URL = process.env.EXPO_PUBLIC_API || "https://ahuiho.okulpanel.com.tr/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper function to get upload URL for photos (sync version)
export const getUploadUrl = (filename, schoolCode = null) => {

  // Geçerli bir dosya adı kontrolü
  if (!filename || typeof filename !== "string" || filename.trim() === "") {
    console.log("No photo or invalid filename, returning null");
    return null;
  }

  // Dosya adını temizle (boşluk ve özel karakterleri kaldır)
  const cleanFilename = filename.trim();

  // Mock fotoğraf işleme (sadece geliştirme için)
  if (
    cleanFilename.includes("ogrenci_") ||
    cleanFilename.includes("ogretmen_") ||
    cleanFilename.includes("admin_")
  ) {
    console.log("Mock photo detected, using placeholder image");

    // Placeholders based on user type
    if (cleanFilename.includes("ogrenci_")) {
      return (
        "https://randomuser.me/api/portraits/children/" +
        (parseInt(cleanFilename.replace(/\D/g, "")) % 100) +
        ".jpg"
      );
    } else if (cleanFilename.includes("ogretmen_")) {
      return (
        "https://randomuser.me/api/portraits/women/" +
        (parseInt(cleanFilename.replace(/\D/g, "")) % 100) +
        ".jpg"
      );
    } else if (cleanFilename.includes("admin_")) {
      return (
        "https://randomuser.me/api/portraits/men/" +
        (parseInt(cleanFilename.replace(/\D/g, "")) % 100) +
        ".jpg"
      );
    }
  }

  // API'den gerçek fotoğraf URL'sini oluştur
  try {
    // Dinamik upload URL'yi oluştur
    const uploadBaseUrl = schoolCode && schoolCode !== 'default' 
      ? `https://${schoolCode}.okulpanel.com.tr/uploads`
      : process.env.EXPO_PUBLIC_FOTO_API || "https://ahuiho.okulpanel.com.tr/uploads";

    // URL sonunda slash olup olmadığını kontrol et
    const baseUrlWithSlash = uploadBaseUrl.endsWith("/")
      ? uploadBaseUrl
      : `${uploadBaseUrl}/`;
    const fullUrl = `${baseUrlWithSlash}${cleanFilename}`;

    return fullUrl;
  } catch (error) {
    console.error("Error generating photo URL:", error);
    return null;
  }
};

// Async version for components that can handle it
export const getUploadUrlAsync = async (filename) => {
  const schoolCode = await getSchoolCode();
  return getUploadUrl(filename, schoolCode);
};

// User API functions
export const fetchUserInfo = async (showErrors = false) => {
  try {
    const token = await getToken();
    console.log(
      "🔍 Fetching user info with token:",
      token ? `${token.substring(0, 15)}...` : "NO TOKEN",
    );

    if (!token) {
      throw new Error("No authentication token available");
    }

    // Try different approaches to make the request work
    try {
      console.log("💡 Trying direct API instance with headers...");
      // Method 1: Using the API instance with explicit headers
      const response = await api.post(
        "/user/info",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      console.log("✅ User info API Response successful (Method 1)!");

      // Fotoğraf URL'sini işle
      if (response.data && response.data.Fotograf) {
        console.log("📸 Photo data received:", response.data.Fotograf);
      } else {
        console.log("⚠️ No photo data in response");
      }

      return response.data;
    } catch (error1) {
      console.log("❌ Method 1 failed:", error1.message);

      // Method 2: Using axios directly with full URL
      console.log("💡 Trying direct axios call...");
      const dynamicApiUrl = await getApiBaseUrl();
      const fullUrl = `${dynamicApiUrl}/user/info`;

      const response = await axios({
        method: "post",
        url: fullUrl,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: {},
      });

      console.log("✅ User info API Response successful (Method 2)!");

      // Fotoğraf URL'sini işle
      if (response.data && response.data.Fotograf) {
        console.log("📸 Photo data received:", response.data.Fotograf);
      } else {
        console.log("⚠️ No photo data in response");
      }

      return response.data;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    // Hatayı fırlat ama sessiz mod etkinse sadece konsola yaz
    if (showErrors) {
      throw error;
    } else {
      // TestFlight için fallback data
      console.log("🔄 Network error - using fallback data for TestFlight");
      return {
        Ad: "Test",
        Soyad: "User",
        Fotograf: "ogrenci_test.jpg",
        Sinif: "12-A",
        OgrenciNo: "12345",
        Cinsiyet: true,
        DogumTarihi: "2005-01-01",
        // Diğer gerekli alanlar...
      };
    }
  }
};

// Teacher API functions
export const fetchTeachers = async (
  page = 1,
  limit = 20,
  showErrors = false,
) => {
  try {
    const token = await getToken();
    console.log(
      "🔍 Fetching teachers with token:",
      token ? `${token.substring(0, 15)}...` : "NO TOKEN",
    );

    const response = await api.post(
      "/teacher/allteacher",
      {
        page,
        limit,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Teachers API Response successful!");
    return response.data;
  } catch (error) {
    console.error("Error fetching teachers:", error);
    if (showErrors) {
      throw error;
    } else {
      return null; // Hata durumunda sessizce null döndür
    }
  }
};

// Students API functions
export const fetchAllStudents = async (showErrors = false) => {
  try {
    const token = await getToken();
    console.log(
      "🔍 Fetching all students with token:",
      token ? `${token.substring(0, 15)}...` : "NO TOKEN",
    );

    if (!token) {
      throw new Error("No authentication token available");
    }

    // Try API instance with explicit headers
    const response = await api.post(
      "/student/all",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    console.log("✅ Students API Response successful!");

    // Validate and log photo information
    if (response.data && Array.isArray(response.data)) {
      console.log(`📋 Received ${response.data.length} students data`);

        

      return response.data;
    } else {
      console.log("⚠️ Invalid students data format from API:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    // Throw error or return empty array depending on showErrors flag
    if (showErrors) {
      throw error;
    } else {
      return []; // Return empty array on error
    }
  }
};

// Messaging API functions
export const sendMessage = async (payload, showLogs = false) => {
  try {
    if (showLogs) {
      console.log("📨 Sending message with payload:", JSON.stringify(payload, null, 2));
    }
    const response = await api.post("/user/mesaj", payload);
    if (showLogs) {
      console.log("✅ Message sent successfully:", response.data);
    }
    return response.data;
  } catch (error) {
    console.error("❌ sendMessage error:", error);
    console.error("❌ Error response:", error.response?.data);
    throw error;
  }
};

// Reference to session clearing function (will be set from SessionProvider)
let clearSessionCallback = null;

export const setSessionClearCallback = (callback) => {
  clearSessionCallback = callback;
};

api.interceptors.request.use(async (config) => {
  try {
    // Dinamik API URL'yi ayarla
    const dynamicBaseUrl = await getApiBaseUrl();
    config.baseURL = dynamicBaseUrl;
    
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("❌ NO TOKEN FOUND in storage for request");
    }
  } catch (error) {
    console.error("❌ Error getting token or setting dynamic URL:", error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token geçersiz veya süresi dolmuş hatası kontrolü
    const isTokenInvalidError =
      error.response?.data?.message === "Token geçersiz veya süresi dolmuş" ||
      error.response?.status === 401;

    // Handle 401 or token invalid message
    if (isTokenInvalidError) {
      console.log(
        "Token invalid error - clearing session and redirecting to login",
      );

      // Try refresh token first
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = await getRefreshToken();

        if (refreshToken) {
          try {
            const refreshResponse = await api.post("/auth/refresh", {
              refreshToken,
            });
            const {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            } = refreshResponse.data;
            await setToken(newAccessToken);
            if (newRefreshToken) {
              await setRefreshToken(newRefreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            console.log("Refresh failed, clearing session");
          }
        }
      }

      // If refresh failed or no refresh token, clear session and navigate to login
      if (clearSessionCallback) {
        console.log("Clearing session due to invalid token");
        await clearSessionCallback();
      }
    }

    return Promise.reject(error);
  },
);

// Student homework API function
export const fetchStudentHomework = async (
  ogrenciID,
  sinif,
  showErrors = false,
) => {
  try {
    console.log("🔍 Fetching student homework with:", { ogrenciID, sinif });
    const dynamicApiUrl = await getApiBaseUrl();
    console.log("🌐 Full API URL will be:", `${dynamicApiUrl}/student/homework`);

    const response = await api.post("/student/homework", {
      OgrenciID: ogrenciID,
      Sinif: sinif,
    });

    console.log("📡 API Response received:", response.status);
    console.log("📋 Response data type:", typeof response.data);
    console.log(
      "📋 Response data length:",
      Array.isArray(response.data) ? response.data.length : "Not an array",
    );

    if (response?.data) {
      console.log("✅ Student homework fetched successfully!");
      console.log("📋 Found", response.data.length, "homework items");
      return response.data;
    } else {
      console.log("⚠️ No homework data returned");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching student homework:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
      console.error("❌ Response headers:", error.response.headers);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      return [];
    }
  }
};

// Teacher exams API function
export const fetchTeacherExams = async (ogretmenID, showErrors = false) => {
  try {
    console.log("🔍 Fetching teacher exams for teacher ID:", ogretmenID);

    const response = await api.post("/teacher/examget", {
      OgretmenID: ogretmenID,
    });

    console.log("📡 Teacher exams API Response received:", response.status);

    if (response?.data) {
      console.log("✅ Teacher exams fetched successfully!");
      console.log("📋 Found", response.data.length, "exam items");
      return response.data;
    } else {
      console.log("⚠️ No exam data returned");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching teacher exams:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      return [];
    }
  }
};

// Teacher homework API function
export const fetchTeacherHomework = async (ogretmenID, showErrors = false) => {
  try {
    console.log("🔍 Fetching teacher homework for teacher ID:", ogretmenID);

    const response = await api.post("/teacher/homework", {
      OgretmenID: ogretmenID,
    });

    console.log("📡 Teacher homework API Response received:", response.status);

    if (response?.data) {
      console.log("✅ Teacher homework fetched successfully!");
      console.log("📋 Found", response.data.length, "homework items");
      return response.data;
    } else {
      console.log("⚠️ No homework data returned");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching teacher homework:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      return [];
    }
  }
};

// Add exam API function
export const addExam = async (examData, showErrors = false) => {
  try {
    console.log("🔍 Adding exam...");

    const response = await api.post("/teacher/exam", examData);

    console.log("📡 Add exam API Response received:", response.status);

    if (response?.data) {
      console.log("✅ Exam added successfully!");
      return response.data;
    } else {
      console.log("⚠️ No response data returned");
      return null;
    }
  } catch (error) {
    console.error("❌ Error adding exam:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      return null;
    }
  }
};

// Delete exam API function
export const deleteExam = async (examID, showErrors = false) => {
  try {
    console.log("🔍 Deleting exam with ID:", examID);

    const response = await api.post("/teacher/examdelete", {
      SinavID: examID,
    });

    console.log("📡 Delete exam API Response received:", response.status);

    if (response?.data) {
      console.log("✅ Exam deleted successfully!");
      return response.data;
    } else {
      console.log("⚠️ No response data returned");
      return null;
    }
  } catch (error) {
    console.error("❌ Error deleting exam:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      return null;
    }
  }
};

// Fetch all classes API function
export const fetchAllClasses = async (showErrors = false) => {
  try {
    console.log("🔍 Fetching all classes...");

    const response = await api.post("/student/classall", {});

    console.log("📡 All classes API Response received:", response.status);

    if (response?.data) {
      console.log("✅ All classes fetched successfully!");
      console.log("📋 Found", response.data.length, "class items");
      return response.data;
    } else {
      console.log("⚠️ No class data returned");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching all classes:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      return [];
    }
  }
};

// Student exams API function
export const fetchStudentExams = async (sinif, showErrors = false) => {
  try {
    console.log("🔍 Fetching student exams for class:", sinif);

    const response = await api.post("/student/exam", {
      Sinif: sinif,
    });

    console.log("📡 Student exams API Response received:", response.status);

    if (response?.data) {
      console.log("✅ Student exams fetched successfully!");
      console.log("📋 Found", response.data.length, "exam items");
      return response.data;
    } else {
      console.log("⚠️ No exam data returned");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching student exams:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      return [];
    }
  }
};

// Ders listesi getirme fonksiyonu
export const fetchSubjects = async (showErrors = false) => {
  try {
    console.log("🔍 Fetching subjects list");

    const response = await api.post("/schedule/dersler", {});

    console.log("📡 Subjects API Response received:", response.status);

    if (response?.data) {
      console.log("✅ Subjects fetched successfully!");
      console.log("📋 Found", response.data.length, "subjects");
      return response.data;
    } else {
      console.log("⚠️ No subjects data returned");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching subjects:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      return [];
    }
  }
};

// Schools API function (static endpoint, no token required)
export const fetchSchools = async (showErrors = false) => {
  try {
    console.log("🔍 Fetching schools list from static API");

    // Direkt axios kullan, token gerektirmeyen sabit endpoint
    const response = await axios({
      method: "post",
      url: "https://www.okulpanel.com.tr/api/center/v1/get/schools",
      data: {},
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("📡 Schools API Response received:", response.status);

    if (response?.data && Array.isArray(response.data)) {
      console.log("✅ Schools fetched successfully!");
      console.log("📋 Found", response.data.length, "schools");
      return response.data;
    } else {
      console.log("⚠️ No schools data returned or invalid format");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching schools:", error);
    console.error("❌ Error message:", error.message);
    if (error.response) {
      console.error("❌ Response status:", error.response.status);
      console.error("❌ Response data:", error.response.data);
    } else if (error.request) {
      console.error(
        "❌ Request was made but no response received:",
        error.request,
      );
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    if (showErrors) {
      throw error;
    } else {
      console.log("📋 Falling back to static schools list");
      return [];
    }
  }
};

// Şifre değiştirme fonksiyonu
export const updatePassword = async (password) => {
  try {
    console.log("🔐 Şifre değiştirme isteği gönderiliyor...");
    
    const response = await api.post("/user/password/update", {
      password: password,
    }, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
    
    console.log("✅ Şifre değiştirme başarılı:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Şifre değiştirme hatası:", error);
    throw error;
  }
};

export default api;




