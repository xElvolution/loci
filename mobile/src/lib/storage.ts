import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Token storage. Native: expo-secure-store (Keychain / Keystore).
 * Web preview only: sessionStorage, so the token is gone when the tab closes.
 */
const web = () => (typeof window !== "undefined" ? window.sessionStorage : null);

export const secure = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") return web()?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") return void web()?.setItem(key, value);
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") return void web()?.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};
