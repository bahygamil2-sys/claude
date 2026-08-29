import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { Button } from "@/components/Button";
import { useCreateAddress, useUpdateAddress, type AddressInput } from "./addressesApi";
import { toast } from "@/store/toastStore";
import type { Address } from "@/types/api";

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Cairo: { lat: 30.0444, lng: 31.2357 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Riyadh: { lat: 24.7136, lng: 46.6753 },
};

function jitteredCoords(city: string) {
  const center = CITY_CENTERS[city] ?? CITY_CENTERS.Cairo;
  return { lat: center.lat + (Math.random() * 2 - 1) * 0.03, lng: center.lng + (Math.random() * 2 - 1) * 0.03 };
}

export function AddressFormModal({ existing, onClose }: { existing?: Address; onClose: () => void }) {
  const { t } = useTranslation("customer");
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const [form, setForm] = useState({
    label: existing?.label ?? "",
    city: existing?.city ?? Object.keys(CITY_CENTERS)[0],
    area: existing?.area ?? "",
    street: existing?.street ?? "",
    building: existing?.building ?? "",
    notes: existing?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const coords = existing ? { lat: existing.lat, lng: existing.lng } : jitteredCoords(form.city);
      const input: AddressInput = {
        label: form.label,
        city: form.city,
        area: form.area || undefined,
        street: form.street,
        building: form.building || undefined,
        notes: form.notes || undefined,
        ...coords,
      };
      if (existing) {
        await updateAddress.mutateAsync({ id: existing.id, input });
      } else {
        await createAddress.mutateAsync(input);
      }
      onClose();
    } catch {
      toast.error(t("common:state.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={existing ? t("profile.editAddress") : t("profile.addAddress")} size="sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input label={t("profile.addressLabel")} required value={form.label} onChange={(e) => set("label", e.target.value)} />
        <Select label={t("profile.addressCity")} value={form.city} onChange={(e) => set("city", e.target.value)}>
          {Object.keys(CITY_CENTERS).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input label={t("profile.addressArea")} value={form.area} onChange={(e) => set("area", e.target.value)} />
        <Input label={t("profile.addressStreet")} required value={form.street} onChange={(e) => set("street", e.target.value)} />
        <Input label={t("profile.addressBuilding")} value={form.building} onChange={(e) => set("building", e.target.value)} />
        <Textarea label={t("profile.addressNotes")} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        <Button type="submit" loading={saving} fullWidth>
          {t("profile.saveAddress")}
        </Button>
      </form>
    </Modal>
  );
}
