import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorCode } from "@/lib/apiError";
import { adminLoginRequest } from "./adminAuthApi";

export default function AdminLoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { admin, accessToken } = await adminLoginRequest(email, password);
      setSession({ actorType: "ADMIN", user: admin }, accessToken);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const code = getApiErrorCode(err);
      setError(t(`auth:errors.${code}`, { defaultValue: t("auth:errors.GENERIC") }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{t("auth:adminLogin.title")}</h1>
        <p className="text-sm text-neutral-500">{t("auth:adminLogin.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          type="email"
          label={t("auth:login.email")}
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          label={t("auth:login.password")}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} fullWidth>
          {t("auth:login.submit")}
        </Button>
      </form>
    </div>
  );
}
