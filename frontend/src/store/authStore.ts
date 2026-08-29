import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/api";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ user: null, accessToken: null }),
    }),
    {
      // Only `user` survives a reload — the access token is memory-only (XSS hygiene) and
      // is re-obtained via the httpOnly refresh cookie on boot (see App.tsx bootstrap).
      name: "sufra-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
