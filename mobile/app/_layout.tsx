//mobile/app/_layout.tsx

import "react-native-reanimated";
import "../global.css";

import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { initI18n, setLanguage } from "../src/i18n/init";
import { useAuthStore } from "../src/store/auth";
import { useThemeStore } from "../src/store/theme";
import { useColorScheme } from "react-native";

const queryClient = new QueryClient();

export default function RootLayout() {
  const loadAuth = useAuthStore((s) => s.loadFromStorage);
  const user = useAuthStore((s) => s.user);

  const loadTheme = useThemeStore((s) => s.load);
  const mode = useThemeStore((s) => s.mode);

  const system = useColorScheme(); // "light" | "dark" | null

  useEffect(() => {
    initI18n();
    loadAuth();
    loadTheme();
  }, [loadAuth, loadTheme]);

  useEffect(() => {
    if (user?.language) setLanguage(user.language);
  }, [user?.language]);

  // effective theme used for StatusBar + screens (we'll use dark: classes; system covers most cases)
  const effectiveTheme = useMemo(() => {
    if (mode === "system") return system ?? "light";
    return mode;
  }, [mode, system]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
