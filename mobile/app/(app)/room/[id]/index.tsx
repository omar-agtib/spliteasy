// app/(app)/room/[id]/index.tsx
import { View, Text, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../../components/Card";
import { useRoomSocket } from "../../../../src/socket/useRoomSocket";

export default function RoomHome() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = String(id);

  const { summary, room, users, refetchAll } = useRoomSocket(roomId);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  const nameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[String(u._id)] = u.name;
    return m;
  }, [users]);

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      <View className="px-5 pt-14 pb-8">
        <Animated.View
          entering={FadeInDown.duration(450)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-semibold text-zinc-900 dark:text-white">
              {room?.name ?? "Room"}
            </Text>
            <Text className="text-zinc-500 mt-1">{t("room.subtitle")}</Text>
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
          className="mt-5"
        >
          <Card>
            <Text className="text-zinc-500">{t("room.totalSpent")}</Text>
            <Text className="text-3xl font-semibold mt-2 text-zinc-900 dark:text-white">
              {summary?.totalSpent ?? 0} {room?.currency ?? "MAD"}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(130).duration(450)}
          className="mt-4"
        >
          <Card>
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
              Room Members ({users.length})
            </Text>
            <View className="gap-2">
              {users.map((u) => (
                <View
                  key={u._id}
                  className="flex-row items-center justify-between py-2"
                >
                  <Text className="text-zinc-900 dark:text-white">
                    {u.name}
                  </Text>
                  <Text className="text-zinc-500 text-sm">
                    {u.email || u.phone}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(180).duration(450)}
          className="mt-4"
        >
          <Card>
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
              {t("room.settleSuggestions")}
            </Text>
            <View className="mt-3 gap-2">
              {(summary?.transfers ?? [])
                .slice(0, 8)
                .map((tr: any, idx: number) => (
                  <Text key={idx} className="text-zinc-700 dark:text-zinc-200">
                    • {nameById[tr.fromUserId] ?? "Someone"} →{" "}
                    {nameById[tr.toUserId] ?? "Someone"}: {tr.amount}{" "}
                    {room?.currency ?? "MAD"}
                  </Text>
                ))}
              {(summary?.transfers ?? []).length === 0 && (
                <Text className="text-zinc-500">{t("room.noDebts")}</Text>
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(220).duration(450)}
          className="mt-4"
        >
          <Card>
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Invite Code
            </Text>
            <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
              {room?.inviteCode}
            </Text>
            <Text className="text-zinc-500 mt-2 text-sm">
              Share this code with others to let them join
            </Text>
          </Card>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
