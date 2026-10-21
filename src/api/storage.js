import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Auth token persistence.
//
// Native (Android/iOS): the JWT is written to the OS-backed encrypted keystore
// (expo-secure-store) so it is not readable from a rooted/backed-up device.
// Web: SecureStore is unavailable, so we fall back to AsyncStorage (localStorage).
//
// expo-secure-store is required lazily and defensively. Its native module is
// resolved on first import and throws if it failed to link, which would otherwise
// crash the app during startup. On any failure we transparently fall back to
// AsyncStorage so authentication keeps working.
const TOKEN_KEY = "token";
const isWeb = Platform.OS === "web";

let secureStore;
let secureStoreChecked = false;

function getSecureStore() {
  if (isWeb) return null;
  if (!secureStoreChecked) {
    secureStoreChecked = true;
    try {
      secureStore = require("expo-secure-store");
    } catch (error) {
      console.warn("expo-secure-store is unavailable; using AsyncStorage instead.", error);
      secureStore = null;
    }
  }
  return secureStore;
}

export async function getToken() {
  const store = getSecureStore();
  if (!store) return AsyncStorage.getItem(TOKEN_KEY);
  try {
    return await store.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn("SecureStore read failed; falling back to AsyncStorage.", error);
    return AsyncStorage.getItem(TOKEN_KEY);
  }
}

export async function setToken(value) {
  const store = getSecureStore();
  if (!store) return AsyncStorage.setItem(TOKEN_KEY, value);
  try {
    return await store.setItemAsync(TOKEN_KEY, value);
  } catch (error) {
    console.warn("SecureStore write failed; falling back to AsyncStorage.", error);
    return AsyncStorage.setItem(TOKEN_KEY, value);
  }
}

export async function removeToken() {
  const store = getSecureStore();
  if (!store) return AsyncStorage.removeItem(TOKEN_KEY);
  try {
    return await store.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn("SecureStore delete failed; falling back to AsyncStorage.", error);
    return AsyncStorage.removeItem(TOKEN_KEY);
  }
}
