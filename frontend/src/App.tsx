import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { bootstrapSession } from "@/lib/apiClient";
import { useUIStore, directionForLanguage } from "@/store/uiStore";
import i18n from "@/i18n";
import { AppRoutes } from "@/routes";
import { ToastContainer } from "@/components/ToastContainer";
import { FullPageSpinner } from "@/components/Spinner";

export default function App() {
  const language = useUIStore((s) => s.language);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    document.documentElement.dir = directionForLanguage(language);
    document.documentElement.lang = language;
    void i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    void bootstrapSession().finally(() => setBootstrapped(true));
  }, []);

  if (!bootstrapped) return <FullPageSpinner />;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
