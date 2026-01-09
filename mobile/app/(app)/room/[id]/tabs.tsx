// app/(app)/room/[id]/tabs.tsx
import { View, Text, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";

type TabRoute = "overview" | "expenses" | "chat" | "analytics";

const tabs: {
  route: TabRoute;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { route: "overview", title: "Overview", icon: "home-outline" },
  { route: "expenses", title: "Expenses", icon: "wallet-outline" },
  { route: "chat", title: "Chat", icon: "chatbubbles-outline" },
  { route: "analytics", title: "Analytics", icon: "bar-chart-outline" },
];

export function RoomTabBar() {
  const params = useLocalSearchParams<{ id: string }>();
  const segments = useSegments();
  const roomId = String(params.id);

  const activeTab = useMemo(() => {
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === roomId || lastSegment === "[id]") return "overview";
    return lastSegment as TabRoute;
  }, [segments, roomId]);

  const navigate = (route: TabRoute) => {
    if (route === "overview") {
      router.push(`/room/${roomId}`);
    } else {
      router.push(`/room/${roomId}/${route}`);
    }
  };

  return (
    <View className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <View className="flex-row h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.route;
          return (
            <Pressable
              key={tab.route}
              onPress={() => navigate(tab.route)}
              className="flex-1 items-center justify-center active:opacity-70"
            >
              <Ionicons
                name={tab.icon}
                size={24}
                color={isActive ? "#111" : "#71717a"}
              />
              <Text
                className={`text-xs mt-1 ${
                  isActive
                    ? "text-zinc-900 dark:text-white font-medium"
                    : "text-zinc-500"
                }`}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
