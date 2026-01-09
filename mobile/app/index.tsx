// mobile/app/index.tsx

import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/auth";

export default function Index() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  if (!hydrated) return null;
  return token ? (
    <Redirect href="/(app)/(tabs)/home" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
