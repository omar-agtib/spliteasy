import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "system" | "light" | "dark";

type State = {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  load: () => Promise<void>;
};

const KEY = "spliteasy_theme_mode";

export const useThemeStore = create<State>((set) => ({
  mode: "system",
  hydrated: false,

  setMode: async (mode) => {
    await SecureStore.setItemAsync(KEY, mode);
    set({ mode });
  },

  load: async () => {
    const v = (await SecureStore.getItemAsync(KEY)) as ThemeMode | null;
    set({ mode: v ?? "system", hydrated: true });
  },
}));
