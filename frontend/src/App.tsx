import { useEffect, useState } from "react";

// Temporary scaffold-verification placeholder. Replaced in the frontend-foundation
// phase with the real router, providers (React Query, i18n, auth), and layouts.
export default function App() {
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    fetch("/api/v1/health")
      .then((res) => (res.ok ? setApiStatus("ok") : setApiStatus("error")))
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold text-brand-600">سُفرة Sufra</h1>
      <p className="text-neutral-600">منصة طلب الطعام أونلاين — قيد الإنشاء</p>
      <p className="text-sm">
        API:{" "}
        <span
          className={
            apiStatus === "ok" ? "text-green-600" : apiStatus === "error" ? "text-red-600" : "text-neutral-500"
          }
        >
          {apiStatus}
        </span>
      </p>
    </div>
  );
}
