import { type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { Button } from "@/components/Button";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { apiClient } from "@/lib/apiClient";
import { toNumber } from "@/lib/money";
import { useCreateMenuItem, useUpdateMenuItem, type MenuItemOptionGroupInput } from "./menuManagementApi";
import type { MenuCategory, MenuItem } from "@/types/api";

export function MenuItemFormModal({
  restaurantId,
  categories,
  existing,
  onClose,
}: {
  restaurantId: string;
  categories: MenuCategory[];
  existing?: MenuItem;
  onClose: () => void;
}) {
  const { t } = useTranslation("restaurant");
  const createItem = useCreateMenuItem(restaurantId);
  const updateItem = useUpdateMenuItem(restaurantId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(existing?.name ?? "");
  const [nameAr, setNameAr] = useState(existing?.nameAr ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [descriptionAr, setDescriptionAr] = useState(existing?.descriptionAr ?? "");
  const [price, setPrice] = useState(existing ? String(toNumber(existing.price)) : "");
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? "");
  const [isVegetarian, setIsVegetarian] = useState(existing?.isVegetarian ?? false);
  const [menuCategoryId, setMenuCategoryId] = useState(existing?.menuCategoryId ?? categories[0]?.id ?? "");
  const [optionGroups, setOptionGroups] = useState<MenuItemOptionGroupInput[]>(
    existing?.optionGroups.map((g) => ({
      name: g.name,
      nameAr: g.nameAr,
      isRequired: g.isRequired,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      options: g.options.map((o) => ({ name: o.name, nameAr: o.nameAr, priceDelta: toNumber(o.priceDelta) })),
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function addGroup() {
    setOptionGroups((prev) => [...prev, { name: "", nameAr: "", isRequired: false, minSelect: 0, maxSelect: 1, options: [{ name: "", nameAr: "", priceDelta: 0 }] }]);
  }
  function updateGroup(idx: number, patch: Partial<MenuItemOptionGroupInput>) {
    setOptionGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }
  function removeGroup(idx: number) {
    setOptionGroups((prev) => prev.filter((_, i) => i !== idx));
  }
  function addOption(groupIdx: number) {
    setOptionGroups((prev) => prev.map((g, i) => (i === groupIdx ? { ...g, options: [...g.options, { name: "", nameAr: "", priceDelta: 0 }] } : g)));
  }
  function updateOption(groupIdx: number, optIdx: number, patch: Partial<{ name: string; nameAr: string; priceDelta: number }>) {
    setOptionGroups((prev) =>
      prev.map((g, i) => (i === groupIdx ? { ...g, options: g.options.map((o, oi) => (oi === optIdx ? { ...o, ...patch } : o)) } : g))
    );
  }
  function removeOption(groupIdx: number, optIdx: number) {
    setOptionGroups((prev) => prev.map((g, i) => (i === groupIdx ? { ...g, options: g.options.filter((_, oi) => oi !== optIdx) } : g)));
  }

  async function onImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.post<{ url: string }>("/uploads/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setImageUrl(res.data.url);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const input = {
        name,
        nameAr,
        description: description || undefined,
        descriptionAr: descriptionAr || undefined,
        price: Number(price),
        imageUrl: imageUrl || undefined,
        isVegetarian,
        menuCategoryId: menuCategoryId || undefined,
        optionGroups: optionGroups
          .filter((g) => g.name && g.options.length > 0)
          .map((g) => ({ ...g, options: g.options.filter((o) => o.name) })),
      };
      if (existing) await updateItem.mutateAsync({ id: existing.id, input });
      else await createItem.mutateAsync(input);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={existing ? t("menu.editItem") : t("menu.addItem")} size="lg">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("menu.itemName")} required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t("menu.itemNameAr")} required value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Textarea label={t("menu.itemDescription")} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Textarea label={t("menu.itemDescriptionAr")} rows={2} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" min={0} step="0.01" label={t("menu.itemPrice")} required value={price} onChange={(e) => setPrice(e.target.value)} />
          <Select label={t("menu.section")} value={menuCategoryId} onChange={(e) => setMenuCategoryId(e.target.value)}>
            <option value="">{t("menu.noSection")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-3">
          {imageUrl && <img src={imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageSelected} />
          <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} className="me-1.5" />
            {t("menu.uploadImage")}
          </Button>
          <label className="flex items-center gap-1.5 text-sm text-neutral-600">
            <input type="checkbox" checked={isVegetarian} onChange={(e) => setIsVegetarian(e.target.checked)} className="accent-brand-600" />
            {t("menu.isVegetarian")}
          </label>
        </div>

        <div className="rounded-lg border border-neutral-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-800">{t("menu.optionGroups")}</span>
            <Button type="button" size="sm" variant="ghost" onClick={addGroup}>
              <Plus size={14} className="me-1" />
              {t("menu.addOptionGroup")}
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {optionGroups.map((group, gi) => (
              <div key={gi} className="rounded-lg bg-neutral-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <input
                    placeholder={t("menu.groupName")}
                    value={group.name}
                    onChange={(e) => updateGroup(gi, { name: e.target.value })}
                    className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                  <input
                    placeholder={t("menu.groupNameAr")}
                    value={group.nameAr}
                    onChange={(e) => updateGroup(gi, { nameAr: e.target.value })}
                    className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-neutral-600">
                    <input type="checkbox" checked={group.isRequired} onChange={(e) => updateGroup(gi, { isRequired: e.target.checked })} className="accent-brand-600" />
                    {t("menu.isRequired")}
                  </label>
                  <button type="button" onClick={() => removeGroup(gi)} className="shrink-0 text-red-500 hover:text-red-700">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {group.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        placeholder={t("menu.optionName")}
                        value={opt.name}
                        onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                        className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                      />
                      <input
                        placeholder={t("menu.optionNameAr")}
                        value={opt.nameAr}
                        onChange={(e) => updateOption(gi, oi, { nameAr: e.target.value })}
                        className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        placeholder={t("menu.priceDelta")}
                        value={opt.priceDelta}
                        onChange={(e) => updateOption(gi, oi, { priceDelta: Number(e.target.value) })}
                        className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                      />
                      <button type="button" onClick={() => removeOption(gi, oi)} className="text-neutral-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(gi)} className="self-start text-xs font-medium text-brand-600 hover:underline">
                    + {t("menu.addOption")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" loading={saving} fullWidth>
          {t("menu.saveItem")}
        </Button>
      </form>
    </Modal>
  );
}
