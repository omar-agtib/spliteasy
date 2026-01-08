//app/(app)/(tabs)/profile.tsx

import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { Card } from "../../../components/Card";
import { PrimaryButton } from "../../../components/PrimaryButton";
import { useAuthStore } from "../../../src/store/auth";

export default function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View className="flex-1 bg-white dark:bg-black px-5 pt-14">
      <Animated.View entering={FadeInDown.duration(450)}>
        <Text className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Profile
        </Text>
        <Text className="text-zinc-500 mt-1">Account & preferences</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(90).duration(450)}
        className="mt-6"
      >
        <Card>
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            {user?.name ?? "User"}
          </Text>
          {!!user?.email && (
            <Text className="text-zinc-500 mt-1">{user.email}</Text>
          )}
          {!!user?.phone && (
            <Text className="text-zinc-500 mt-1">{user.phone}</Text>
          )}
          <Text className="text-zinc-500 mt-2">
            Language: {user?.language ?? "en"}
          </Text>

          <View className="h-4" />

          <PrimaryButton
            title="Settings"
            onPress={() => router.push("/(app)/settings")}
            variant="light"
          />
          <View className="h-3" />
          <PrimaryButton
            title="Logout"
            onPress={() => {
              logout();
              router.replace("/(auth)/login");
            }}
          />
        </Card>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(150).duration(450)}
        className="mt-4"
      ></Animated.View>
    </View>
  );
}
