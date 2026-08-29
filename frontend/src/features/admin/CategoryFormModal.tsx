import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCreateCategory, useUpdateCategory } from "./adminApi";
import type { Category } from "@/types/api";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryFormModal({ existing, onClose }: { existing?: Category; onClose: () => void }) {
  const { t } = useTranslation(["admin", "common"]);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState(existing?.name ?? "");
  const [nameAr, setNameAr] = useState(existing?.nameAr ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(existing));
  const [icon, setIcon] = useState(existing?.icon ?? "");
  const [sortOrder, setSortOrder] = useState(String(existing?.sortOrder ?? 0));
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const input = { name, nameAr, slug, icon: icon || undefined, sortOrder: Number(sortOrder) };
      if (existing) await updateCategory.mutateAsync({ id: existing.id, input });
      else await createCategory.mutateAsync(input);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={existing ? t("categories.edit") : t("categories.add")} size="sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("categories.name")}
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
          <Input label={t("categories.nameAr")} required value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </div>
        <Input label={t("categories.slug")} required value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} hint={t("categories.slugHint")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("categories.icon")} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍕" maxLength={10} />
          <Input type="number" label={t("categories.sortOrder")} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <Button type="submit" loading={saving} fullWidth>
          {t("common:actions.save")}
        </Button>
      </form>
    </Modal>
  );
}
