import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCategories } from "@/features/restaurants/restaurantsApi";
import { useDeleteCategory } from "./adminApi";
import { useLocalized } from "@/hooks/useLocalized";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { CategoryFormModal } from "./CategoryFormModal";
import type { Category } from "@/types/api";

export default function AdminCategoriesPage() {
  const { t } = useTranslation(["admin", "common"]);
  const pick = useLocalized();
  const categoriesQuery = useCategories();
  const deleteCategory = useDeleteCategory();
  const [modal, setModal] = useState<Category | null | undefined>(undefined);

  async function onDelete(category: Category) {
    if (!window.confirm(t("categories.deleteConfirm", { name: pick(category.name, category.nameAr) }))) return;
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const sorted = [...(categoriesQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">{t("categories.title")}</h1>
        <Button size="sm" onClick={() => setModal(null)}>
          <Plus size={14} className="me-1" />
          {t("categories.add")}
        </Button>
      </div>

      {categoriesQuery.isLoading ? (
        <Spinner />
      ) : sorted.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xl">{c.icon || "🍽️"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-neutral-800">{pick(c.name, c.nameAr)}</p>
                <p className="truncate text-xs text-neutral-400">{c.slug}</p>
              </div>
              <button onClick={() => setModal(c)} className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600">
                <Pencil size={14} />
              </button>
              <button onClick={() => onDelete(c)} className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-neutral-400">{t("common:state.empty")}</p>
      )}

      {modal !== undefined && <CategoryFormModal existing={modal ?? undefined} onClose={() => setModal(undefined)} />}
    </div>
  );
}
