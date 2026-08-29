import clsx from "clsx";
import { useToastStore } from "@/store/toastStore";

const TONE_CLASSES = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-neutral-900",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={clsx("max-w-sm rounded-lg px-4 py-2.5 text-start text-sm text-white shadow-lg", TONE_CLASSES[t.tone])}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
