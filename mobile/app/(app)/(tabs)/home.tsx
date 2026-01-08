//app/(app)/(tabs)/home.tsx
import { View, Text, Pressable, FlatList } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "../../../src/api/api";
import { Card } from "../../../components/Card";
import { PrimaryButton } from "../../../components/PrimaryButton";

export default function HomeTab() {
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await api.get("/rooms")).data,
  });

  const rooms = data?.rooms ?? [];

  return (
    <View className="flex-1 bg-white dark:bg-black px-5 pt-14">
      <Animated.View
        entering={FadeInDown.duration(450)}
        className="flex-row items-center justify-between"
      >
        <View>
          <Text className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Your Rooms
          </Text>
          <Text className="text-zinc-500 mt-1">Tap a room to open</Text>
        </View>

        <Pressable
          onPress={() => router.push("/(app)/create-room")}
          className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 active:opacity-80"
        >
          <Text className="text-zinc-700 dark:text-white">+ New</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(90).duration(450)}
        className="mt-5"
      >
        <PrimaryButton
          title="Join room by code"
          onPress={() => router.push("/(app)/join-room")}
          variant="light"
        />
      </Animated.View>

      <FlatList
        className="mt-6"
        data={rooms}
        keyExtractor={(r) => r._id}
        refreshing={isFetching}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(app)/room/[id]",
                params: { id: String(item._id) },
              })
            }
            className="active:opacity-90"
          >
            <Card>
              <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                {item.name}
              </Text>
              <Text className="text-zinc-500 mt-1">
                {item.type ?? "general"} • {item.currency ?? "MAD"} •{" "}
                {item.members?.length ?? 0} members
              </Text>

              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-zinc-700 dark:text-zinc-200">
                  Invite: {item.inviteCode}
                </Text>
                <Text className="text-zinc-500">Open →</Text>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="mt-10">
            <Text className="text-zinc-500">
              No rooms yet. Create one or join by code.
            </Text>
          </View>
        }
      />
    </View>
  );
}
