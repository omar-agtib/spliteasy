//app/(app)/rooms_create.tsx

import { View, Text, TextInput } from "react-native";
import { useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { api } from "../../src/api/api";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";

export default function RoomsJoin() {
  const { t } = useTranslation();
  const [inviteCode, setInviteCode] = useState("");
  const [err, setErr] = useState("");

  async function join() {
    try {
      setErr("");
      await api.post("/rooms/join", {
        inviteCode: inviteCode.trim().toUpperCase(),
      });
      router.replace("/(app)/rooms");
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed");
    }
  }

  return (
    <View className="flex-1 bg-white px-5 pt-14">
      <Animated.View entering={FadeInDown.duration(450)}>
        <Text className="text-2xl font-semibold">{t("joinRoom.title")}</Text>
        <Text className="text-zinc-500 mt-1">{t("joinRoom.subtitle")}</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(80).duration(450)}
        className="mt-6"
      >
        <Card>
          <Text className="text-zinc-700 mb-2">{t("joinRoom.code")}</Text>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            className="border border-zinc-200 rounded-xl px-4 py-3"
          />
          {!!err && <Text className="text-red-600 mt-3">{err}</Text>}
          <PrimaryButton title={t("joinRoom.cta")} onPress={join} />
          <PrimaryButton
            title={t("common.back")}
            onPress={() => router.back()}
            variant="light"
            style={{ marginTop: 12 }}
          />
        </Card>
      </Animated.View>
    </View>
  );
}
