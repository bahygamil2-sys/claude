import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorCode } from "@/lib/apiError";
import { brandLoginRequest } from "./authApi";

export default function LoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const location = useLocation();
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
      const { user, accessToken } = await brandLoginRequest(email, password);
      setSession({ actorType: "BRAND_USER", user }, accessToken);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/dashboard", { replace: true });
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
        <h1 className="text-xl font-bold text-neutral-900">{t("auth:login.title")}</h1>
        <p className="text-sm text-neutral-500">{t("auth:login.subtitle")}</p>
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

      <p className="text-center text-xs text-neutral-400">{t("auth:login.demoHint", { password: "Passw0rd!" })}</p>

      <p className="text-center text-sm text-neutral-600">
        {t("auth:login.noAccount")}{" "}
        <Link to="/signup" className="font-medium text-brand-600 hover:underline">
          {t("auth:login.createOne")}
        </Link>
      </p>
    </div>
  );
}
