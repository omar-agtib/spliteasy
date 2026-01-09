// // app/(app)/room/[id]/_layout.tsx
// import { Tabs } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";

// export default function RoomLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarShowLabel: true,
//         tabBarActiveTintColor: "#111",
//         tabBarInactiveTintColor: "#71717a",
//         tabBarStyle: {
//           borderTopWidth: 0,
//           elevation: 10,
//           height: 62,
//           paddingBottom: 10,
//           paddingTop: 8,
//           backgroundColor: "#fff",
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Overview",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="home-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="expenses"
//         options={{
//           title: "Expenses",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="wallet-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="chat"
//         options={{
//           title: "Chat",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="chatbubbles-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="analytics"
//         options={{
//           title: "Analytics",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="bar-chart-outline" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

// app/(app)/room/[id]/_layout.tsx
import { Stack } from "expo-router";

export default function RoomLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
