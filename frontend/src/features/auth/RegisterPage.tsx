import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorCode } from "@/lib/apiError";
import { registerRequest } from "./authApi";
import type { Role } from "@/types/api";

export default function RegisterPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Extract<Role, "CUSTOMER" | "RESTAURANT_OWNER">>("CUSTOMER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await registerRequest({ name, email, password, phone: phone || undefined, role });
      setSession(user, accessToken);
      navigate(role === "RESTAURANT_OWNER" ? "/restaurant-dashboard" : "/", { replace: true });
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
        <h1 className="text-xl font-bold text-neutral-900">{t("auth:register.title")}</h1>
        <p className="text-sm text-neutral-500">{t("auth:register.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label={t("auth:register.name")} required value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" label={t("auth:register.email")} required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={t("auth:register.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input
          type="password"
          label={t("auth:register.password")}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-700">{t("auth:register.role")}</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("CUSTOMER")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${role === "CUSTOMER" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"}`}
            >
              {t("auth:register.roleCustomer")}
            </button>
            <button
              type="button"
              onClick={() => setRole("RESTAURANT_OWNER")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${role === "RESTAURANT_OWNER" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"}`}
            >
              {t("auth:register.roleOwner")}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} fullWidth>
          {t("auth:register.submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600">
        {t("auth:register.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          {t("auth:register.signIn")}
        </Link>
      </p>
    </div>
  );
}
