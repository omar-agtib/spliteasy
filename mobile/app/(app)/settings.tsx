//app/(app)/settings.tsx
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/auth";
import { api } from "../../src/api/api";
import { setLanguage } from "../../src/i18n/init";
import { Card } from "../../components/Card";
import { registerForPushToken } from "../../src/notifications/registerPush";
import { useThemeStore, ThemeMode } from "../../src/store/theme";

const langs = [
  { key: "en", label: "English" },
  { key: "fr", label: "Français" },
  { key: "ar", label: "العربية" },
  { key: "darija", label: "Darija" },
] as const;

const themes: { key: ThemeMode; label: string }[] = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

export default function Settings() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.token);

  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  async function onSetLang(lng: any) {
    setLanguage(lng);
    if (token && user) {
      await api.put("/me/language", { language: lng });
      await setSession(token, { ...user, language: lng });
    }
  }

  async function savePushToken() {
    const pt = await registerForPushToken();
    if (pt) await api.put("/me/push-token", { pushToken: pt });
    alert(
      pt
        ? t("settings.push")
        : "Push may be limited in Expo Go. Use a Dev Build for full push support."
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black px-5 pt-14">
      <Animated.View
        entering={FadeInDown.duration(450)}
        className="flex-row items-center justify-between"
      >
        <View>
          <Text className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {t("settings.title")}
          </Text>
          <Text className="text-zinc-500 mt-1">{t("settings.language")}</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 active:opacity-80"
        >
          <Text className="text-zinc-700 dark:text-white">
            {t("common.back")}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(80).duration(450)}
        className="mt-6"
      >
        <Card>
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            Theme
          </Text>
          <View className="mt-3 gap-2">
            {themes.map((th) => (
              <Pressable
                key={th.key}
                onPress={() => setThemeMode(th.key)}
                className={`px-4 py-4 rounded-2xl border ${
                  themeMode === th.key
                    ? "border-black dark:border-white"
                    : "border-zinc-200 dark:border-zinc-800"
                } active:opacity-80`}
              >
                <Text className="text-base text-zinc-900 dark:text-white">
                  {th.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="h-6" />

          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            {t("settings.language")}
          </Text>
          <View className="mt-3 gap-2">
            {langs.map((l) => (
              <Pressable
                key={l.key}
                onPress={() => onSetLang(l.key)}
                className={`px-4 py-4 rounded-2xl border ${
                  user?.language === l.key
                    ? "border-black dark:border-white"
                    : "border-zinc-200 dark:border-zinc-800"
                } active:opacity-80`}
              >
                <Text className="text-base text-zinc-900 dark:text-white">
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={savePushToken}
            className="mt-4 px-4 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 active:opacity-80"
          >
            <Text className="text-zinc-900 dark:text-white">
              🔔 Save push token (Dev Build recommended)
            </Text>
          </Pressable>
        </Card>
      </Animated.View>
    </View>
  );
}
