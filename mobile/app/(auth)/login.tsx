//app/(auth)/login.tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/auth";
import { api } from "../../src/api/api";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";

export default function Login() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onLogin() {
    try {
      setErr("");
      const isEmail = emailOrPhone.includes("@");
      const payload = isEmail
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password };
      const { data } = await api.post("/auth/login", payload);
      await setSession(data.token, data.user);
      router.replace("/(app)/(tabs)/home");
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  }

  return (
    <View className="flex-1 bg-white px-5 pt-16">
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text className="text-3xl font-semibold">{t("login.title")}</Text>
        <Text className="text-zinc-500 mt-2">{t("login.subtitle")}</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(500)}
        className="mt-8"
      >
        <Card>
          <Text className="text-zinc-700 mb-2">{t("login.emailOrPhone")}</Text>
          <TextInput
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            placeholder={t("login.placeholderEmailOrPhone")}
            className="border border-zinc-200 rounded-xl px-4 py-3"
          />
          <Text className="text-zinc-700 mb-2 mt-4">{t("login.password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            className="border border-zinc-200 rounded-xl px-4 py-3"
          />
          {!!err && <Text className="text-red-600 mt-3">{err}</Text>}
          <PrimaryButton title={t("login.cta")} onPress={onLogin} />
          <Pressable
            onPress={() => router.push("/(auth)/register")}
            className="py-4"
          >
            <Text className="text-center text-zinc-600">
              {t("login.toRegister")}
            </Text>
          </Pressable>
        </Card>
      </Animated.View>
    </View>
  );
}
