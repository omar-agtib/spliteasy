import { Pressable, Text, ViewStyle } from "react-native";

export function PrimaryButton({
  title,
  onPress,
  variant = "dark",
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "dark" | "light";
  style?: ViewStyle;
}) {
  const cls =
    variant === "dark"
      ? "bg-black dark:bg-white"
      : "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800";
  const textCls =
    variant === "dark"
      ? "text-white dark:text-black"
      : "text-zinc-900 dark:text-white";
  return (
    <Pressable
      onPress={onPress}
      style={style}
      className={`rounded-2xl py-4 active:opacity-80 ${cls}`}
    >
      <Text className={`text-center font-semibold ${textCls}`}>{title}</Text>
    </Pressable>
  );
}
