//app/(app)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#111",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 10,
          height: 62,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const name =
            route.name === "home"
              ? focused
                ? "home"
                : "home-outline"
              : route.name === "analytics"
                ? focused
                  ? "pie-chart"
                  : "pie-chart-outline"
                : focused
                  ? "person"
                  : "person-outline";

          return (
            <Ionicons name={name as any} size={size ?? 22} color={color} />
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Rooms" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
