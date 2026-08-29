import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession } from "@/types/api";

type AuthState = {
  session: AuthSession | null;
  accessToken: string | null;
  setSession: (session: AuthSession, accessToken: string) => void;
  setAccessToken: (accessToken: string | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      accessToken: null,
      setSession: (session, accessToken) => set({ session, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ session: null, accessToken: null }),
    }),
    {
      // Only `session` survives a reload — the access token is memory-only (XSS hygiene)
      // and is re-obtained via the matching httpOnly refresh cookie on boot (see apiClient's
      // bootstrapSession, called from App.tsx).
      name: "rai-auth",
      partialize: (state) => ({ session: state.session }),
    }
  )
);
