import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useAuthStore } from "../store/auth";

function getApiHost() {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim();

  // If you set a real IP/domain in .env, use it
  if (env && !env.includes("localhost") && !env.includes("127.0.0.1")) {
    return env.replace(/\/$/, "");
  }

  // Android emulator cannot reach host via localhost
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }

  // Try to infer your dev machine LAN IP from Expo hostUri (works on iOS device & simulator)
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri;

  if (typeof hostUri === "string" && hostUri.length > 0) {
    const ip = hostUri.split(":")[0]; // "192.168.x.x:19000" -> "192.168.x.x"
    if (ip && ip !== "localhost") return `http://${ip}:4000`;
  }

  // Final fallback (works on iOS simulator, but NOT on real devices)
  return "http://localhost:4000";
}

const baseURL = getApiHost();

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
