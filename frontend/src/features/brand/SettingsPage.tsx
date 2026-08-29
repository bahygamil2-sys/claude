import { type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useOwnBrand, useUpdateOwnBrand } from "./brandApi";
import { Input, Textarea } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card, CardBody } from "@/components/Card";
import { FullPageSpinner } from "@/components/Spinner";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";

export default function SettingsPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const session = useAuthStore((s) => s.session);
  const isOwner = session?.actorType === "BRAND_USER" && session.user.role === "OWNER";
  const brandQuery = useOwnBrand();
  const updateBrand = useUpdateOwnBrand();

  const [form, setForm] = useState({ name: "", nameAr: "", description: "", descriptionAr: "", logoUrl: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (brandQuery.data) {
      setForm({
        name: brandQuery.data.name,
        nameAr: brandQuery.data.nameAr,
        description: brandQuery.data.description ?? "",
        descriptionAr: brandQuery.data.descriptionAr ?? "",
        logoUrl: brandQuery.data.logoUrl ?? "",
      });
    }
  }, [brandQuery.data]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateBrand.mutateAsync({
        name: form.name,
        nameAr: form.nameAr,
        description: form.description || undefined,
        descriptionAr: form.descriptionAr || undefined,
        logoUrl: form.logoUrl || undefined,
      });
      toast.success(t("dashboard:settings.saved"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (brandQuery.isLoading) return <FullPageSpinner />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-bold text-neutral-900">{t("dashboard:settings.title")}</h1>
      {!isOwner && <p className="text-sm text-neutral-500">{t("dashboard:settings.readOnlyHint")}</p>}

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("dashboard:settings.name")}
                required
                disabled={!isOwner}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <Input
                label={t("dashboard:settings.nameAr")}
                required
                disabled={!isOwner}
                value={form.nameAr}
                onChange={(e) => set("nameAr", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Textarea
                label={t("dashboard:settings.description")}
                rows={3}
                disabled={!isOwner}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <Textarea
                label={t("dashboard:settings.descriptionAr")}
                rows={3}
                disabled={!isOwner}
                value={form.descriptionAr}
                onChange={(e) => set("descriptionAr", e.target.value)}
              />
            </div>
            <Input
              label={t("dashboard:settings.logoUrl")}
              disabled={!isOwner}
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
            />
            {isOwner && (
              <Button type="submit" loading={saving}>
                {t("common:actions.save")}
              </Button>
            )}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
