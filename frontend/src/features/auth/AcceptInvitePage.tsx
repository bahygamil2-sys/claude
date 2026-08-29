import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorCode } from "@/lib/apiError";
import { acceptInviteRequest } from "./authApi";

export default function AcceptInvitePage() {
  const { t } = useTranslation(["auth", "common"]);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth:acceptInvite.passwordMismatch"));
      return;
    }
    if (!token) return;

    setLoading(true);
    try {
      const { user, accessToken } = await acceptInviteRequest(token, password);
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
        <h1 className="text-xl font-bold text-neutral-900">{t("auth:acceptInvite.title")}</h1>
        <p className="text-sm text-neutral-500">{t("auth:acceptInvite.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          type="password"
          label={t("auth:acceptInvite.password")}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          label={t("auth:acceptInvite.confirmPassword")}
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} fullWidth>
          {t("auth:acceptInvite.submit")}
        </Button>
      </form>
    </div>
  );
}
