import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCreateMenuCategory, useUpdateMenuCategory } from "./menuManagementApi";
import type { MenuCategory } from "@/types/api";

export function MenuCategoryFormModal({ restaurantId, existing, onClose }: { restaurantId: string; existing?: MenuCategory; onClose: () => void }) {
  const { t } = useTranslation("restaurant");
  const createCategory = useCreateMenuCategory(restaurantId);
  const updateCategory = useUpdateMenuCategory(restaurantId);

  const [name, setName] = useState(existing?.name ?? "");
  const [nameAr, setNameAr] = useState(existing?.nameAr ?? "");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (existing) await updateCategory.mutateAsync({ id: existing.id, input: { name, nameAr } });
      else await createCategory.mutateAsync({ name, nameAr });
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t("menu.addCategory")} size="sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input label={t("menu.categoryName")} required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t("menu.categoryNameAr")} required value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        <Button type="submit" loading={saving} fullWidth>
          {t("common:actions.save")}
        </Button>
      </form>
    </Modal>
  );
}
