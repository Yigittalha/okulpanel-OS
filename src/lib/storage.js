  import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const SCHOOL_CODE_KEY = "schoolCode";
const SCHOOL_PHOTO_KEY = "schoolPhoto";
const ROLE_KEY = "role";
const USER_KEY = "user";
const THEME_KEY = "theme";
const APP_VERSION_KEY = "appVersion";

async function save(key, value) {
  if (value === null || value === undefined) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    );
  }
}

async function read(key) {
  const value = await SecureStore.getItemAsync(key);
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function setToken(token) {
  try {
    await save(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error("❌ Error in setToken():", error);
  }
}
export async function getToken() {
  try {
    const token = await read(ACCESS_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error("❌ Error in getToken():", error);
    return null;
  }
}
export async function setRefreshToken(token) {
  return save(REFRESH_TOKEN_KEY, token);
}
export async function getRefreshToken() {
  return read(REFRESH_TOKEN_KEY);
}
export async function setSchoolCode(code) {
  return save(SCHOOL_CODE_KEY, code);
}
export async function getSchoolCode() {
  return read(SCHOOL_CODE_KEY);
}
export async function setSchoolPhoto(photo) {
  return save(SCHOOL_PHOTO_KEY, photo);
}
export async function getSchoolPhoto() {
  return read(SCHOOL_PHOTO_KEY);
}
export async function setRole(role) {
  return save(ROLE_KEY, role);
}
export async function getRole() {
  return read(ROLE_KEY);
}
export async function setUser(user) {
  return save(USER_KEY, user);
}
export async function getUser() {
  return read(USER_KEY);
}
export async function setTheme(theme) {
  return save(THEME_KEY, theme);
}
export async function getTheme() {
  return read(THEME_KEY);
}


export async function setAppVersion(version) {
  return save(APP_VERSION_KEY, version);
}

export async function getAppVersion() {
  return read(APP_VERSION_KEY);
}

// Tüm storage'ı temizle
export async function clearAllStorage() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(SCHOOL_CODE_KEY),
    SecureStore.deleteItemAsync(SCHOOL_PHOTO_KEY),
    SecureStore.deleteItemAsync(ROLE_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
    SecureStore.deleteItemAsync(THEME_KEY),
    SecureStore.deleteItemAsync(APP_VERSION_KEY),
  ]);
  console.log("🧹 Tüm storage temizlendi");
}
