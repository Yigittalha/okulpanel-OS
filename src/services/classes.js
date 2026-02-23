import api from "../lib/api";

// Sınıf listesi için API fonksiyonu - Sınav Ekleme sayfasındaki çalışan kodun birebir aynısı
export const fetchClassList = async (showErrors = false) => {
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
