import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "../api/api";
import { useAuthStore } from "../store/auth";

function getSocketHost() {
  // api.baseURL is like: http://IP:4000/api
  const apiBase = api.defaults.baseURL || "";
  if (apiBase.endsWith("/api")) return apiBase.slice(0, -4);

  // If for some reason baseURL isn't set, fallback like in api.ts
  if (Platform.OS === "android") return "http://10.0.2.2:4000";

  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri;

  if (typeof hostUri === "string" && hostUri.length > 0) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost") return `http://${ip}:4000`;
  }

  return "http://localhost:4000";
}

export function useRoomSocket(roomId: string) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);

  const [room, setRoom] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const refetchAll = useCallback(async () => {
    if (!roomId) return;

    const [r, u, s] = await Promise.all([
      api.get(`/rooms/${roomId}`),
      api.get(`/rooms/${roomId}/users`),
      api.get(`/rooms/${roomId}/summary`),
    ]);

    setRoom(r.data?.room ?? r.data);
    setUsers(u.data?.users ?? u.data ?? []);
    setSummary(s.data?.summary ?? s.data);
  }, [roomId]);

  useEffect(() => {
    if (!token || !roomId) return;

    const host = getSocketHost();

    const socket = io(host, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", roomId);
      refetchAll().catch(() => {});
    });

    socket.on("disconnect", () => {});

    const onRefresh = () => refetchAll().catch(() => {});
    socket.on("expense_added", onRefresh);
    socket.on("expense_updated", onRefresh);
    socket.on("expense_deleted", onRefresh);

    return () => {
      socket.emit("leave_room", roomId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, token, refetchAll]);

  return { socket: socketRef.current, room, users, summary, refetchAll };
}
