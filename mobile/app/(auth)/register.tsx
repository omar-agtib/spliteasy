//app/(auth)/register.tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { api } from "../../src/api/api";
import { useAuthStore } from "../../src/store/auth";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";

export default function Register() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onRegister() {
    try {
      setErr("");
      const isEmail = emailOrPhone.includes("@");
      const payload = isEmail
        ? { name, email: emailOrPhone, password }
        : { name, phone: emailOrPhone, password };
      const { data } = await api.post("/auth/register", payload);
      await setSession(data.token, data.user);
      router.replace("/(app)/(tabs)/home");
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Register failed");
    }
  }

  return (
    <View className="flex-1 bg-white px-5 pt-16">
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text className="text-3xl font-semibold">{t("register.title")}</Text>
        <Text className="text-zinc-500 mt-2">{t("register.subtitle")}</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(500)}
        className="mt-8"
      >
        <Card>
          <Text className="text-zinc-700 mb-2">{t("register.name")}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Abdo"
            className="border border-zinc-200 rounded-xl px-4 py-3"
          />

          <Text className="text-zinc-700 mb-2 mt-4">
            {t("register.emailOrPhone")}
          </Text>
          <TextInput
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            placeholder={t("register.placeholderEmailOrPhone")}
            className="border border-zinc-200 rounded-xl px-4 py-3"
          />

          <Text className="text-zinc-700 mb-2 mt-4">
            {t("register.password")}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            className="border border-zinc-200 rounded-xl px-4 py-3"
          />

          {!!err && <Text className="text-red-600 mt-3">{err}</Text>}

          <PrimaryButton title={t("register.cta")} onPress={onRegister} />
          <Pressable onPress={() => router.back()} className="py-4">
            <Text className="text-center text-zinc-600">
              {t("register.toLogin")}
            </Text>
          </Pressable>
        </Card>
      </Animated.View>
    </View>
  );
}
