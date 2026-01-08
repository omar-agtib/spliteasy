// app/(app)/room/[id]/analytics.tsx

import { View, Text, Pressable, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, router, useSegments } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../src/api/api";
import { Card } from "../../../../components/Card";
import { BarChart, LineChart } from "react-native-gifted-charts";

function toDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Analytics() {
  const segments = useSegments();
  const params = useLocalSearchParams<{ id?: string }>();

  // Extract roomId from either params or segments
  const roomId = params.id || (segments[3] as string);

  const { data } = useQuery({
    queryKey: ["expenses", roomId],
    queryFn: async () => (await api.get(`/expenses/room/${roomId}`)).data,
    enabled: !!roomId,
  });

  const expenses = data?.expenses ?? [];

  // Category totals
  const catMap: Record<string, number> = {};
  for (const e of expenses) {
    const k = e.category || "other";
    catMap[k] = (catMap[k] || 0) + Number(e.amount || 0);
  }

  const catEntries = Object.entries(catMap)
    .map(([k, v]) => ({ k, v: Math.round(v * 100) / 100 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 7);

  const barData = catEntries.map((x) => ({
    value: x.v,
    label: x.k,
  }));

  // Daily totals (last 14)
  const dayMap: Record<string, number> = {};
  for (const e of expenses) {
    const k = toDayKey(new Date(e.date));
    dayMap[k] = (dayMap[k] || 0) + Number(e.amount || 0);
  }

  const dayEntries = Object.entries(dayMap)
    .map(([k, v]) => ({ k, v: Math.round(v * 100) / 100 }))
    .sort((a, b) => (a.k < b.k ? -1 : 1))
    .slice(-14);

  const lineData = dayEntries.map((x) => ({
    value: x.v,
    label: x.k.slice(5), // show MM-DD
  }));

  if (!roomId) {
    return (
      <View className="flex-1 bg-white dark:bg-black items-center justify-center">
        <Text className="text-zinc-500">No room selected</Text>
      </View>
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
            Analytics
          </Text>
          <Text className="text-zinc-500 mt-1">Insights for this room</Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 active:opacity-80"
        >
          <Text className="text-zinc-700 dark:text-white">Back</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        className="mt-6"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            Spend by category
          </Text>

          {barData.length === 0 ? (
            <Text className="text-zinc-500 mt-3">No data yet.</Text>
          ) : (
            <View className="mt-4">
              <BarChart
                data={barData}
                barWidth={22}
                spacing={18}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ fontSize: 10 }}
                xAxisLabelTextStyle={{ fontSize: 10 }}
                noOfSections={4}
                isAnimated
                animationDuration={700}
              />
            </View>
          )}
        </Card>

        <Card>
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            Spend over time (last 14 days)
          </Text>

          {lineData.length === 0 ? (
            <Text className="text-zinc-500 mt-3">No data yet.</Text>
          ) : (
            <View className="mt-4">
              <LineChart
                data={lineData}
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ fontSize: 10 }}
                xAxisLabelTextStyle={{ fontSize: 10 }}
                spacing={22}
                initialSpacing={10}
                isAnimated
                animationDuration={700}
                curved
              />
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
