import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type Lang = "en" | "fr" | "ar" | "darija";
export type User = { _id: string; name: string; email?: string; phone?: string; language: Lang };

type State = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
};

const TOKEN_KEY = "spliteasy_token";
const USER_KEY = "spliteasy_user";

export const useAuthStore = create<State>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  setSession: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user, hydrated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null, hydrated: true });
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const raw = await SecureStore.getItemAsync(USER_KEY);
    const user = raw ? (JSON.parse(raw) as User) : null;
    set({ token: token ?? null, user, hydrated: true });
  },
}));
