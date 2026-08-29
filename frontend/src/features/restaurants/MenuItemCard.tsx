import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Leaf, Plus } from "lucide-react";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { AddToCartModal } from "./AddToCartModal";
import type { MenuItem, Restaurant } from "@/types/api";

export function MenuItemCard({ item, restaurant }: { item: MenuItem; restaurant: Restaurant }) {
  const { t } = useTranslation("customer");
  const pick = useLocalized();
  const currency = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => item.isAvailable && setOpen(true)}
        disabled={!item.isAvailable}
        className="flex w-full items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 text-start transition-shadow hover:shadow-sm disabled:opacity-60"
      >
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            {item.isVegetarian && <Leaf size={14} className="text-green-600" />}
            <h4 className="font-medium text-neutral-900">{pick(item.name, item.nameAr)}</h4>
          </div>
          {(item.description || item.descriptionAr) && (
            <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{pick(item.description ?? "", item.descriptionAr ?? "")}</p>
          )}
          <p className="mt-1.5 text-sm font-semibold text-neutral-800">{currency(item.price)}</p>
          {!item.isAvailable && <p className="mt-1 text-xs font-medium text-red-500">{t("restaurantDetail.itemUnavailable")}</p>}
        </div>
        {item.isAvailable && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Plus size={16} />
          </span>
        )}
      </button>
      {open && <AddToCartModal item={item} restaurant={restaurant} onClose={() => setOpen(false)} />}
    </>
  );
}
