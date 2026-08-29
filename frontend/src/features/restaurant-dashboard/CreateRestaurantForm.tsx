import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCreateRestaurant } from "./restaurantOwnerApi";

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Cairo: { lat: 30.0444, lng: 31.2357 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Riyadh: { lat: 24.7136, lng: 46.6753 },
};

export function CreateRestaurantForm() {
  const { t } = useTranslation("restaurant");
  const createRestaurant = useCreateRestaurant();

  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    city: Object.keys(CITY_CENTERS)[0],
    addressLine: "",
    phone: "",
    deliveryFee: "15",
    minOrderAmount: "50",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const center = CITY_CENTERS[form.city];
      await createRestaurant.mutateAsync({
        name: form.name,
        nameAr: form.nameAr,
        city: form.city,
        addressLine: form.addressLine,
        phone: form.phone,
        deliveryFee: Number(form.deliveryFee),
        minOrderAmount: Number(form.minOrderAmount),
        lat: center.lat,
        lng: center.lng,
      });
      toast.success(t("create.success"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-neutral-900">{t("create.title")}</h1>
        <p className="mb-5 text-sm text-neutral-500">{t("create.subtitle")}</p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input label={t("create.name")} required value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label={t("create.nameAr")} required value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
          <Select label={t("create.city")} value={form.city} onChange={(e) => set("city", e.target.value)}>
            {Object.keys(CITY_CENTERS).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input label={t("create.addressLine")} required value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
          <Input label={t("create.phone")} required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" min={0} label={t("create.deliveryFee")} value={form.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} />
            <Input type="number" min={0} label={t("create.minOrderAmount")} value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} />
          </div>
          <Button type="submit" loading={createRestaurant.isPending} fullWidth className="mt-2">
            {t("create.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
