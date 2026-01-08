//app/(app)/(tabs)/analytics.tsx

import { View, Text, Pressable, FlatList } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQueries, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "../../../src/api/api";
import { Card } from "../../../components/Card";

export default function AnalyticsTab() {
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await api.get("/rooms")).data,
  });

  const rooms = data?.rooms ?? [];

  // Fetch a quick summary per room (optional but nice)
  // If you don't have /rooms/:id/summary in your backend, it will fail.
  // In that case, you can delete this useQueries block and show only "Open analytics".
  const summaries = useQueries({
    queries: rooms.map((r: any) => ({
      queryKey: ["roomSummary", r._id],
      queryFn: async () => (await api.get(`/rooms/${r._id}/summary`)).data,
      staleTime: 15_000,
      retry: 0,
    })),
  });

  const summaryByRoomId: Record<string, any> = {};
  rooms.forEach((r: any, idx: number) => {
    summaryByRoomId[String(r._id)] = summaries[idx]?.data ?? null;
  });

  return (
    <View className="flex-1 bg-white dark:bg-black px-5 pt-14">
      <Animated.View entering={FadeInDown.duration(450)}>
        <Text className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Analytics
        </Text>
        <Text className="text-zinc-500 mt-1">See insights for each room</Text>
      </Animated.View>

      <FlatList
        className="mt-6"
        data={rooms}
        keyExtractor={(r) => r._id}
        refreshing={isFetching}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => {
          const s = summaryByRoomId[String(item._id)];
          const totalSpent = s?.totalSpent ?? null;
          const transfersCount = Array.isArray(s?.transfers)
            ? s.transfers.length
            : null;

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(app)/room/[id]/analytics",
                  params: { id: String(item._id) },
                })
              }
              className="active:opacity-90"
            >
              <Card>
                <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {item.name}
                </Text>

                {totalSpent != null ? (
                  <Text className="text-zinc-500 mt-1">
                    Total spent: {totalSpent} {item.currency ?? "MAD"}
                    {transfersCount != null
                      ? ` • Suggestions: ${transfersCount}`
                      : ""}
                  </Text>
                ) : (
                  <Text className="text-zinc-500 mt-1">
                    {item.currency ?? "MAD"} • Tap to open analytics
                  </Text>
                )}

                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-zinc-700 dark:text-zinc-200">
                    Members: {item.members?.length ?? 0}
                  </Text>
                  <Text className="text-zinc-500">Open →</Text>
                </View>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="mt-10">
            <Text className="text-zinc-500">No rooms yet.</Text>
          </View>
        }
      />
    </View>
  );
}
