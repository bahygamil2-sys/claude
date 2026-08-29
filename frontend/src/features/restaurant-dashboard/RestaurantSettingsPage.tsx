import { type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { useRestaurantDashboard } from "./RestaurantDashboardContext";
import { useUpdateRestaurant } from "./restaurantOwnerApi";
import { useCategories } from "@/features/restaurants/restaurantsApi";
import { useLocalized } from "@/hooks/useLocalized";
import { apiClient } from "@/lib/apiClient";
import { toNumber } from "@/lib/money";
import { Input, Textarea } from "@/components/Input";
import { Button } from "@/components/Button";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";

export default function RestaurantSettingsPage() {
  const { selected } = useRestaurantDashboard();
  return <RestaurantSettingsForm key={selected.id} />;
}

function RestaurantSettingsForm() {
  const { t } = useTranslation("restaurant");
  const pick = useLocalized();
  const { selected } = useRestaurantDashboard();
  const updateRestaurant = useUpdateRestaurant();
  const categoriesQuery = useCategories();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: selected.name,
    nameAr: selected.nameAr,
    description: selected.description ?? "",
    descriptionAr: selected.descriptionAr ?? "",
    addressLine: selected.addressLine,
    phone: selected.phone,
    deliveryFee: String(toNumber(selected.deliveryFee)),
    minOrderAmount: String(toNumber(selected.minOrderAmount)),
    avgPreparationTimeMinutes: String(selected.avgPreparationTimeMinutes),
    openTime: selected.openTime,
    closeTime: selected.closeTime,
    isOpen: selected.isOpen,
    logoUrl: selected.logoUrl ?? "",
    coverImageUrl: selected.coverImageUrl ?? "",
  });
  const [categoryIds, setCategoryIds] = useState<string[]>(selected.categories.map((c) => c.id));
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function uploadImage(file: File, setUrl: (url: string) => void, setBusy: (busy: boolean) => void) {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.post<{ url: string }>("/uploads/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUrl(res.data.url);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRestaurant.mutateAsync({
        id: selected.id,
        input: {
          name: form.name,
          nameAr: form.nameAr,
          description: form.description || undefined,
          descriptionAr: form.descriptionAr || undefined,
          addressLine: form.addressLine,
          phone: form.phone,
          deliveryFee: Number(form.deliveryFee),
          minOrderAmount: Number(form.minOrderAmount),
          avgPreparationTimeMinutes: Number(form.avgPreparationTimeMinutes),
          openTime: form.openTime,
          closeTime: form.closeTime,
          isOpen: form.isOpen,
          logoUrl: form.logoUrl || undefined,
          coverImageUrl: form.coverImageUrl || undefined,
          categoryIds,
        },
      });
      toast.success(t("settings.saved"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-bold text-neutral-900">{t("settings.title")}</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("settings.basicInfo")}</h2>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("create.name")} value={form.name} onChange={(e) => set("name", e.target.value)} />
              <Input label={t("create.nameAr")} value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Textarea label={t("create.description")} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
              <Textarea label={t("create.descriptionAr")} rows={2} value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} />
            </div>
            <Input label={t("create.addressLine")} value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
            <Input label={t("create.phone")} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("settings.hoursAndFees")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input type="time" label={t("settings.openTime")} value={form.openTime} onChange={(e) => set("openTime", e.target.value)} />
            <Input type="time" label={t("settings.closeTime")} value={form.closeTime} onChange={(e) => set("closeTime", e.target.value)} />
            <Input type="number" min={0} label={t("create.deliveryFee")} value={form.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} />
            <Input type="number" min={0} label={t("create.minOrderAmount")} value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} />
            <Input type="number" min={1} label={t("settings.avgPrepTime")} value={form.avgPreparationTimeMinutes} onChange={(e) => set("avgPreparationTimeMinutes", e.target.value)} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={form.isOpen} onChange={(e) => set("isOpen", e.target.checked)} className="accent-brand-600" />
            {t("settings.isOpenNow")}
          </label>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("settings.images")}</h2>
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2">
              {form.logoUrl ? <img src={form.logoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-neutral-100" />}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], (u) => set("logoUrl", u), setUploadingLogo)} />
              <Button type="button" size="sm" variant="outline" loading={uploadingLogo} onClick={() => logoInputRef.current?.click()}>
                <Upload size={13} className="me-1" />
                {t("settings.logo")}
              </Button>
            </div>
            <div className="flex flex-col items-center gap-2">
              {form.coverImageUrl ? <img src={form.coverImageUrl} alt="" className="h-16 w-28 rounded-lg object-cover" /> : <div className="h-16 w-28 rounded-lg bg-neutral-100" />}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], (u) => set("coverImageUrl", u), setUploadingCover)} />
              <Button type="button" size="sm" variant="outline" loading={uploadingCover} onClick={() => coverInputRef.current?.click()}>
                <Upload size={13} className="me-1" />
                {t("settings.cover")}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("settings.categories")}</h2>
          <div className="flex flex-wrap gap-2">
            {categoriesQuery.data?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${categoryIds.includes(c.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"}`}
              >
                {c.icon} {pick(c.name, c.nameAr)}
              </button>
            ))}
          </div>
        </section>

        <Button type="submit" loading={saving} size="lg">
          {t("common:actions.save")}
        </Button>
      </form>
    </div>
  );
}
