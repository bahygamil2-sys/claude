import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "./addressesApi";
import { useUpdateProfile } from "./profileApi";
import { AddressFormModal } from "./AddressFormModal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { Address } from "@/types/api";

export default function ProfilePage() {
  const { t } = useTranslation("customer");
  const user = useAuthStore((s) => s.user);
  const addressesQuery = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [editingAddress, setEditingAddress] = useState<Address | null | undefined>(undefined);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ name, phone: phone || undefined });
      toast.success(t("profile.savedSuccess"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onDelete(addr: Address) {
    if (!window.confirm(t("profile.deleteConfirm"))) return;
    try {
      await deleteAddress.mutateAsync(addr.id);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-neutral-900">{t("profile.title")}</h1>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("profile.personalInfo")}</h2>
        <form onSubmit={onSaveProfile} className="flex flex-col gap-3">
          <Input label={t("profile.name")} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t("profile.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" loading={updateProfile.isPending} className="self-start">
            {t("profile.saveChanges")}
          </Button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800">{t("profile.addresses")}</h2>
          <button onClick={() => setEditingAddress(null)} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            <Plus size={14} />
            {t("profile.addAddress")}
          </button>
        </div>

        {addressesQuery.isLoading ? (
          <Spinner />
        ) : addressesQuery.data && addressesQuery.data.length > 0 ? (
          <div className="flex flex-col gap-2">
            {addressesQuery.data.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-neutral-400" />
                  <div className="text-sm">
                    <p className="flex items-center gap-2 font-medium text-neutral-800">
                      {addr.label}
                      {addr.isDefault && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600">{t("profile.defaultBadge")}</span>}
                    </p>
                    <p className="text-neutral-500">
                      {addr.street}, {addr.city}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefaultAddress.mutate(addr.id)}
                      title={t("profile.setDefault")}
                      className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-amber-500"
                    >
                      <Star size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingAddress(addr)}
                    title={t("profile.editAddress")}
                    className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600"
                  >
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => onDelete(addr)} className="rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-neutral-50 px-3 py-4 text-center text-sm text-neutral-500">{t("profile.noAddresses")}</p>
        )}
      </section>

      {editingAddress !== undefined && <AddressFormModal existing={editingAddress ?? undefined} onClose={() => setEditingAddress(undefined)} />}
    </div>
  );
}
