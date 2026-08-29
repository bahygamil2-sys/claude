import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";
export interface ToastMessage {
  id: string;
  tone: ToastTone;
  text: string;
}

type ToastState = {
  toasts: ToastMessage[];
  push: (tone: ToastTone, text: string) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (tone, text) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, tone, text }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (text: string) => useToastStore.getState().push("success", text),
  error: (text: string) => useToastStore.getState().push("error", text),
  info: (text: string) => useToastStore.getState().push("info", text),
};
