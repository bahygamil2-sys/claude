import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useCreateBranch, useUpdateBranch } from "./branchesApi";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { RestaurantBranch } from "@/types/api";

export function BranchFormModal({ open, onClose, branch }: { open: boolean; onClose: () => void; branch: RestaurantBranch | null }) {
  const { t } = useTranslation(["dashboard", "common"]);
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const [form, setForm] = useState({
    name: branch?.name ?? "",
    nameAr: branch?.nameAr ?? "",
    address: branch?.address ?? "",
    addressAr: branch?.addressAr ?? "",
    city: branch?.city ?? "",
    cityAr: branch?.cityAr ?? "",
    phone: branch?.phone ?? "",
    isActive: branch?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const input = { ...form, phone: form.phone || undefined };
      if (branch) {
        await updateBranch.mutateAsync({ id: branch.id, input });
      } else {
        await createBranch.mutateAsync(input);
      }
      toast.success(t("dashboard:branches.saved"));
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={branch ? t("dashboard:branches.editBranch") : t("dashboard:branches.addBranch")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("dashboard:branches.name")} required value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label={t("dashboard:branches.nameAr")} required value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("dashboard:branches.address")} required value={form.address} onChange={(e) => set("address", e.target.value)} />
          <Input label={t("dashboard:branches.addressAr")} required value={form.addressAr} onChange={(e) => set("addressAr", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("dashboard:branches.city")} required value={form.city} onChange={(e) => set("city", e.target.value)} />
          <Input label={t("dashboard:branches.cityAr")} required value={form.cityAr} onChange={(e) => set("cityAr", e.target.value)} />
        </div>
        <Input label={t("dashboard:branches.phone")} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        {branch && (
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-brand-600" />
            {t("dashboard:branches.isActive")}
          </label>
        )}
        <Button type="submit" loading={saving} fullWidth>
          {t("common:actions.save")}
        </Button>
      </form>
    </Modal>
  );
}
