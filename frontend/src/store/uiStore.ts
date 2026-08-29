import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SupportedLanguage } from "@/i18n";

type UIState = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: "ar",
      setLanguage: (language) => set({ language }),
    }),
    { name: "rai-ui" }
  )
);

export function directionForLanguage(language: SupportedLanguage): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}
