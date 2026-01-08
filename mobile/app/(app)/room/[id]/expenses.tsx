// app/(app)/room/[id]/expenses.tsx

import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, router, useSegments } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../../../src/api/api";
import { useRoomSocket } from "../../../../src/socket/useRoomSocket";
import { Card } from "../../../../components/Card";
import { PrimaryButton } from "../../../../components/PrimaryButton";
import { useAuthStore } from "../../../../src/store/auth";

const categories = [
  "food",
  "transport",
  "accommodation",
  "entertainment",
  "utilities",
  "groceries",
  "other",
] as const;
type SplitMode = "equal" | "unequal";

export default function Expenses() {
  const { t } = useTranslation();
  const segments = useSegments();
  const params = useLocalSearchParams<{ id?: string }>();

  // Extract roomId from either params or segments
  const roomId = params.id || (segments[3] as string);

  const me = useAuthStore((s) => s.user);
  const { room, users, refetchAll } = useRoomSocket(roomId);

  const nameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[String(u._id)] = u.name;
    return m;
  }, [users]);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["expenses", roomId],
    queryFn: async () => (await api.get(`/expenses/room/${roomId}`)).data,
    enabled: !!roomId,
  });

  const expenses = data?.expenses ?? [];

  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<string | null>(me?._id ?? null);
  const [cat, setCat] = useState<(typeof categories)[number]>("other");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [splitIds, setSplitIds] = useState<string[]>(me?._id ? [me._id] : []);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    {}
  );
  const [err, setErr] = useState("");

  function toggleSplit(uid: string) {
    setSplitIds((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  }

  function resetForm() {
    setOpen(false);
    setDesc("");
    setAmount("");
    setCat("other");
    setPaidBy(me?._id ?? null);
    setSplitMode("equal");
    setSplitIds(me?._id ? [me._id] : []);
    setCustomAmounts({});
    setErr("");
  }

  async function createExpense() {
    if (!roomId) return;
    try {
      setErr("");
      const amt = Number(amount);
      if (!desc.trim()) return setErr("Description required");
      if (!amt || amt <= 0) return setErr("Amount invalid");
      if (!paidBy) return setErr("PaidBy required");

      if (splitMode === "equal") {
        if (splitIds.length === 0) return setErr("Choose at least 1 person");

        await api.post("/expenses", {
          roomId,
          description: desc.trim(),
          amount: amt,
          category: cat,
          paidBy,
          splitMode: "equal",
          splitBetweenUserIds: splitIds,
        });
      } else {
        const rows = splitIds.map((uid) => ({
          userId: uid,
          amount: Number(customAmounts[uid] || 0),
        }));

        const sum = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        if (rows.some((r) => !r.amount || r.amount <= 0))
          return setErr("All custom amounts must be > 0");
        if (Math.abs(sum - amt) > 0.01)
          return setErr("Custom amounts must sum to total");

        await api.post("/expenses", {
          roomId,
          description: desc.trim(),
          amount: amt,
          category: cat,
          paidBy,
          splitMode: "unequal",
          splitBetween: rows,
        });
      }

      resetForm();
      await refetch();
      await refetchAll();
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed");
    }
  }

  async function markMyShareSettled(expenseId: string) {
    try {
      await api.post(`/expenses/${expenseId}/settle`, {});
      await refetch();
      await refetchAll();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to settle");
    }
  }

  async function uploadReceipt(expenseId: string) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission", "Media library permission is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const uri = asset.uri;

    const form = new FormData();
    form.append("receipt", {
      uri,
      name: "receipt.jpg",
      type: "image/jpeg",
    } as any);

    try {
      await api.post(`/expenses/${expenseId}/receipt`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refetch();
      await refetchAll();
    } catch (e: any) {
      Alert.alert("Upload error", e?.response?.data?.message || "Failed");
    }
  }

  if (!roomId) {
    return (
      <View className="flex-1 bg-white dark:bg-black items-center justify-center">
        <Text className="text-zinc-500">No room selected</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black px-5 pt-14">
      <Animated.View
        entering={FadeInDown.duration(450)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {t("expenses.title")}
          </Text>
          <Text className="text-zinc-500 mt-1">{room?.name ?? ""}</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 active:opacity-80"
        >
          <Text className="text-zinc-700 dark:text-white">
            {t("common.back")}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(80).duration(450)}
        className="mt-5"
      >
        <PrimaryButton
          title={t("expenses.add")}
          onPress={() => setOpen(true)}
        />
      </Animated.View>

      <FlatList
        className="mt-6"
        data={expenses}
        keyExtractor={(e) => e._id}
        refreshing={isFetching}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => {
          const mySplit = (item.splitBetween ?? []).find(
            (s: any) => String(s.userId) === String(me?._id)
          );
          const mySettled = !!mySplit?.settled;

          return (
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {item.description}
                </Text>
                <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {item.amount} {room?.currency ?? "MAD"}
                </Text>
              </View>
              <Text className="text-zinc-500 mt-1">
                {item.category} • {new Date(item.date).toLocaleDateString()}
              </Text>

              <Text className="text-zinc-700 dark:text-zinc-200 mt-2">
                {t("expenses.paidBy")}:{" "}
                <Text className="font-semibold">
                  {nameById[item.paidBy] ?? "—"}
                </Text>
              </Text>

              <Text className="text-zinc-700 dark:text-zinc-200 mt-1">
                {t("expenses.splitWith")}:{" "}
                <Text className="font-semibold">
                  {(item.splitBetween ?? [])
                    .map(
                      (s: any) =>
                        `${nameById[s.userId] ?? "—"} (${s.amount}${s.settled ? "✓" : ""})`
                    )
                    .join(", ")}
                </Text>
              </Text>

              {item.receiptImage ? (
                <Pressable
                  onPress={() => {}}
                  className="mt-3 active:opacity-80"
                >
                  <Image
                    source={{ uri: item.receiptImage }}
                    style={{ width: "100%", height: 160, borderRadius: 16 }}
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => uploadReceipt(item._id)}
                  className="mt-3 px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 active:opacity-80"
                >
                  <Text className="text-zinc-900 dark:text-white">
                    📷 Upload receipt
                  </Text>
                </Pressable>
              )}

              {mySplit && String(item.paidBy) !== String(me?._id) && (
                <Pressable
                  onPress={() => markMyShareSettled(item._id)}
                  disabled={mySettled}
                  className={`mt-3 px-4 py-3 rounded-2xl ${mySettled ? "bg-zinc-200 dark:bg-zinc-800" : "bg-black dark:bg-white"} active:opacity-80`}
                >
                  <Text
                    className={`${mySettled ? "text-zinc-700 dark:text-zinc-200" : "text-white dark:text-black"} font-semibold`}
                  >
                    {mySettled
                      ? "Settled ✓"
                      : `Mark my share paid (${mySplit.amount} ${room?.currency ?? "MAD"})`}
                  </Text>
                </Pressable>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          <View className="mt-10">
            <Text className="text-zinc-500">{t("expenses.empty")}</Text>
          </View>
        }
      />

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 bg-black/30 justify-end">
          <View className="bg-white dark:bg-zinc-950 rounded-t-3xl p-5 max-h-[90%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("expenses.add")}
              </Text>

              {/* DESCRIPTION */}
              <Text className="text-zinc-700 dark:text-zinc-200 mt-4 mb-2">
                {t("expenses.desc")}
              </Text>
              <TextInput
                value={desc}
                onChangeText={setDesc}
                placeholder="Dinner at restaurant"
                placeholderTextColor="#a1a1aa"
                className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white"
              />

              {/* AMOUNT */}
              <Text className="text-zinc-700 dark:text-zinc-200 mt-4 mb-2">
                {t("expenses.amount")}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#a1a1aa"
                className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white"
              />

              {/* CATEGORY */}
              <Text className="text-zinc-700 dark:text-zinc-200 mt-4 mb-2">
                {t("expenses.category")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCat(c)}
                    className={`px-3 py-2 rounded-full border ${
                      cat === c
                        ? "border-black dark:border-white bg-black dark:bg-white"
                        : "border-zinc-200 dark:border-zinc-800"
                    } active:opacity-80`}
                  >
                    <Text
                      className={`${
                        cat === c
                          ? "text-white dark:text-black"
                          : "text-zinc-900 dark:text-white"
                      }`}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* PAID BY */}
              <Text className="text-zinc-700 dark:text-zinc-200 mt-4 mb-2">
                {t("expenses.paidBy")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {users.map((u) => (
                  <Pressable
                    key={u._id}
                    onPress={() => setPaidBy(String(u._id))}
                    className={`px-3 py-2 rounded-full border ${
                      paidBy === String(u._id)
                        ? "border-black dark:border-white bg-black dark:bg-white"
                        : "border-zinc-200 dark:border-zinc-800"
                    } active:opacity-80`}
                  >
                    <Text
                      className={`${
                        paidBy === String(u._id)
                          ? "text-white dark:text-black"
                          : "text-zinc-900 dark:text-white"
                      }`}
                    >
                      {u.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* SPLIT MODE */}
              <Text className="text-zinc-700 dark:text-zinc-200 mt-4 mb-2">
                Split mode
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setSplitMode("equal")}
                  className={`flex-1 px-4 py-3 rounded-2xl border ${
                    splitMode === "equal"
                      ? "border-black dark:border-white bg-black dark:bg-white"
                      : "border-zinc-200 dark:border-zinc-800"
                  } active:opacity-80`}
                >
                  <Text
                    className={`text-center ${
                      splitMode === "equal"
                        ? "text-white dark:text-black"
                        : "text-zinc-900 dark:text-white"
                    }`}
                  >
                    Equal
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSplitMode("unequal")}
                  className={`flex-1 px-4 py-3 rounded-2xl border ${
                    splitMode === "unequal"
                      ? "border-black dark:border-white bg-black dark:bg-white"
                      : "border-zinc-200 dark:border-zinc-800"
                  } active:opacity-80`}
                >
                  <Text
                    className={`text-center ${
                      splitMode === "unequal"
                        ? "text-white dark:text-black"
                        : "text-zinc-900 dark:text-white"
                    }`}
                  >
                    Unequal
                  </Text>
                </Pressable>
              </View>

              {/* SPLIT WITH */}
              <Text className="text-zinc-700 dark:text-zinc-200 mt-4 mb-2">
                {t("expenses.splitWith")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {users.map((u) => {
                  const selected = splitIds.includes(String(u._id));
                  return (
                    <Pressable
                      key={u._id}
                      onPress={() => toggleSplit(String(u._id))}
                      className={`px-3 py-2 rounded-full border ${
                        selected
                          ? "border-black dark:border-white bg-black dark:bg-white"
                          : "border-zinc-200 dark:border-zinc-800"
                      } active:opacity-80`}
                    >
                      <Text
                        className={`${
                          selected
                            ? "text-white dark:text-black"
                            : "text-zinc-900 dark:text-white"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {u.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* CUSTOM AMOUNTS (if unequal) */}
              {splitMode === "unequal" && splitIds.length > 0 && (
                <View className="mt-4">
                  <Text className="text-zinc-700 dark:text-zinc-200 mb-2">
                    Custom amounts (must sum to total)
                  </Text>
                  <View className="gap-2">
                    {splitIds.map((uid) => (
                      <View
                        key={uid}
                        className="flex-row items-center justify-between gap-3"
                      >
                        <Text className="text-zinc-900 dark:text-white flex-1">
                          {nameById[uid] ?? "—"}
                        </Text>
                        <TextInput
                          value={customAmounts[uid] ?? ""}
                          onChangeText={(v) =>
                            setCustomAmounts((p) => ({ ...p, [uid]: v }))
                          }
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#a1a1aa"
                          className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white w-32"
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ERROR MESSAGE */}
              {!!err && (
                <Text className="text-red-600 dark:text-red-400 mt-3">
                  {err}
                </Text>
              )}

              {/* ACTION BUTTONS */}
              <View className="mt-5 flex-row gap-3">
                <PrimaryButton
                  title={t("common.cancel")}
                  onPress={resetForm}
                  variant="light"
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  title={t("common.save")}
                  onPress={createExpense}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
