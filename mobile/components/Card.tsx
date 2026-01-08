import { ReactNode } from "react";
import { View } from "react-native";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm ${className}`}
    >
      {children}
    </View>
  );
}
