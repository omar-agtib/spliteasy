// app/(app)/room/[id]/chat.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../../../src/api/api";
import { useAuthStore } from "../../../../src/store/auth";
import { useRoomSocket } from "../../../../src/socket/useRoomSocket";

export default function Chat() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();

  // roomId comes from the dynamic route param: /room/[id]/chat
  const roomId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const me = useAuthStore((s) => s.user);
  const { socket, room, users } = useRoomSocket(roomId);

  const nameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[String(u._id)] = u.name;
    return m;
  }, [users]);

  const [messages, setMessages] = useState<any[]>([]);
  const [value, setValue] = useState("");
  const listRef = useRef<FlatList>(null);

  async function load() {
    if (!roomId) return;
    try {
      const { data } = await api.get(`/messages/room/${roomId}`);
      setMessages(data.messages ?? []);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }

  useEffect(() => {
    load();
  }, [roomId]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const onNew = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 10);
    };

    socket.on("new_message", onNew);
    return () => {
      socket.off("new_message", onNew);
    };
  }, [socket, roomId]);

  async function send() {
    const v = value.trim();
    if (!v || !roomId) return;
    setValue("");
    try {
      await api.post("/messages", { roomId, message: v });
    } catch (error) {
      console.error("Failed to send:", error);
    }
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <View className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <Text className="text-xl font-semibold text-zinc-900 dark:text-white">
          {room?.name ?? t("Chat")}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => {
          const mine = String(item.senderId) === String(me?._id);
          return (
            <Animated.View
              entering={FadeInDown.duration(200)}
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                mine
                  ? "self-end bg-black dark:bg-white"
                  : "self-start bg-zinc-100 dark:bg-zinc-900"
              }`}
            >
              {!mine && (
                <Text className="text-xs mb-1 text-zinc-500">
                  {nameById[String(item.senderId)] ?? "User"}
                </Text>
              )}
              <Text
                className={`text-base ${
                  mine
                    ? "text-white dark:text-black"
                    : "text-zinc-900 dark:text-white"
                }`}
              >
                {item.message}
              </Text>
            </Animated.View>
          );
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={92}
        className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800"
      >
        <View className="flex-row items-end gap-3">
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={t("Type a message...")}
            placeholderTextColor="#a1a1aa"
            multiline
            className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 max-h-28 text-zinc-900 dark:text-white"
          />
          <Pressable
            onPress={send}
            className="bg-black dark:bg-white rounded-2xl px-5 py-4 active:opacity-80"
          >
            <Text className="text-white dark:text-black font-semibold">
              Send
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
