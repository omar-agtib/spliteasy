//app/(app)/_layout.tsx
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Bottom tabs */}
      <Stack.Screen name="(tabs)" />

      {/* Room flows (details screens) */}
      <Stack.Screen name="room" />
    </Stack>
  );
}
