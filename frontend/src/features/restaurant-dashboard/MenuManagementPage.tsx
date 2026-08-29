import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Pencil, Plus, Trash2 } from "lucide-react";
import { useRestaurantDashboard } from "./RestaurantDashboardContext";
import { useDeleteMenuCategory, useDeleteMenuItem, useSetItemAvailability } from "./menuManagementApi";
import { apiClient } from "@/lib/apiClient";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { MenuCategoryFormModal } from "./MenuCategoryFormModal";
import { MenuItemFormModal } from "./MenuItemFormModal";
import type { MenuCategory, MenuItem, RestaurantMenu } from "@/types/api";

export default function MenuManagementPage() {
  const { t } = useTranslation("restaurant");
  const pick = useLocalized();
  const currency = useCurrency();
  const { selected } = useRestaurantDashboard();

  const menuQuery = useQuery({
    queryKey: ["restaurant-menu", selected.id],
    queryFn: async () => (await apiClient.get<RestaurantMenu>(`/restaurants/${selected.id}/menu`)).data,
  });

  const deleteCategory = useDeleteMenuCategory(selected.id);
  const deleteItem = useDeleteMenuItem(selected.id);
  const setAvailability = useSetItemAvailability(selected.id);

  const [categoryModal, setCategoryModal] = useState<MenuCategory | null | undefined>(undefined);
  const [itemModal, setItemModal] = useState<MenuItem | null | undefined>(undefined);

  const categories = menuQuery.data?.menuCategories ?? [];

  async function onDeleteCategory(id: string) {
    if (!window.confirm(t("menu.deleteCategoryConfirm"))) return;
    try {
      await deleteCategory.mutateAsync(id);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }
  async function onDeleteItem(id: string) {
    if (!window.confirm(t("menu.deleteItemConfirm"))) return;
    try {
      await deleteItem.mutateAsync(id);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  function renderItemRow(item: MenuItem) {
    return (
      <div key={item.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-300">—</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-medium text-neutral-800">
            {item.isVegetarian && <Leaf size={13} className="shrink-0 text-green-600" />}
            {pick(item.name, item.nameAr)}
          </p>
          <p className="text-xs text-neutral-500">{currency(item.price)}</p>
        </div>
        <button
          onClick={() => setAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })}
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${item.isAvailable ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}
        >
          {item.isAvailable ? t("menu.available") : t("menu.unavailable")}
        </button>
        <button onClick={() => setItemModal(item)} className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600">
          <Pencil size={15} />
        </button>
        <button onClick={() => onDeleteItem(item.id)} className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500">
          <Trash2 size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-neutral-900">{t("menu.title")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoryModal(null)}>
            <Plus size={14} className="me-1" />
            {t("menu.addCategory")}
          </Button>
          <Button size="sm" onClick={() => setItemModal(null)}>
            <Plus size={14} className="me-1" />
            {t("menu.addItem")}
          </Button>
        </div>
      </div>

      {menuQuery.isLoading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((category) => (
            <div key={category.id}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-bold text-neutral-900">{pick(category.name, category.nameAr)}</h2>
                <div className="flex gap-1">
                  <button onClick={() => setCategoryModal(category)} className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDeleteCategory(category.id)} className="rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {category.menuItems.length > 0 ? category.menuItems.map(renderItemRow) : <p className="text-sm text-neutral-400">{t("menu.noItems")}</p>}
              </div>
            </div>
          ))}
          {menuQuery.data && menuQuery.data.uncategorized.length > 0 && (
            <div>
              <h2 className="mb-2 text-base font-bold text-neutral-900">{t("menu.noSection")}</h2>
              <div className="flex flex-col gap-2">{menuQuery.data.uncategorized.map(renderItemRow)}</div>
            </div>
          )}
        </div>
      )}

      {categoryModal !== undefined && <MenuCategoryFormModal restaurantId={selected.id} existing={categoryModal ?? undefined} onClose={() => setCategoryModal(undefined)} />}
      {itemModal !== undefined && <MenuItemFormModal restaurantId={selected.id} categories={categories} existing={itemModal ?? undefined} onClose={() => setItemModal(undefined)} />}
    </div>
  );
}
