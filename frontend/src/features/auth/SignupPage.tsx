import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorCode } from "@/lib/apiError";
import { brandSignupRequest } from "./authApi";

export default function SignupPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [brandName, setBrandName] = useState("");
  const [brandNameAr, setBrandNameAr] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await brandSignupRequest({ brandName, brandNameAr, ownerName, email, password });
      setSession({ actorType: "BRAND_USER", user }, accessToken);
      navigate("/dashboard", { replace: true });
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
        <h1 className="text-xl font-bold text-neutral-900">{t("auth:signup.title")}</h1>
        <p className="text-sm text-neutral-500">{t("auth:signup.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("auth:signup.brandName")} required value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          <Input label={t("auth:signup.brandNameAr")} required value={brandNameAr} onChange={(e) => setBrandNameAr(e.target.value)} />
        </div>
        <Input label={t("auth:signup.ownerName")} required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        <Input
          type="email"
          label={t("auth:signup.email")}
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          label={t("auth:signup.password")}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} fullWidth>
          {t("auth:signup.submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600">
        {t("auth:signup.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          {t("auth:signup.signIn")}
        </Link>
      </p>
    </div>
  );
}
