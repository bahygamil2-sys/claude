import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { toNumber } from "@/lib/money";
import { useCartStore, type CartLineOption } from "@/store/cartStore";
import { toast } from "@/store/toastStore";
import type { MenuItem, Restaurant } from "@/types/api";

export function AddToCartModal({ item, restaurant, onClose }: { item: MenuItem; restaurant: Restaurant; onClose: () => void }) {
  const { t } = useTranslation("customer");
  const pick = useLocalized();
  const currency = useCurrency();
  const addItem = useCartStore((s) => s.addItem);
  const currentRestaurantId = useCartStore((s) => s.restaurantId);
  const currentRestaurantName = useCartStore((s) => s.restaurantName);

  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  const basePrice = toNumber(item.price);

  const unitPrice = useMemo(() => {
    let total = basePrice;
    for (const group of item.optionGroups) {
      for (const optionId of selected[group.id] ?? []) {
        const opt = group.options.find((o) => o.id === optionId);
        if (opt) total += toNumber(opt.priceDelta);
      }
    }
    return total;
  }, [basePrice, item.optionGroups, selected]);

  function toggleOption(groupId: string, optionId: string, maxSelect: number) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (maxSelect === 1) {
        return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
      }
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      if (next.length > maxSelect) return prev;
      return { ...prev, [groupId]: next };
    });
  }

  function isValid() {
    return item.optionGroups.every((g) => !g.isRequired || (selected[g.id]?.length ?? 0) >= Math.max(1, g.minSelect));
  }

  function handleAdd() {
    if (!isValid()) {
      toast.error(t("restaurantDetail.requiredChoice"));
      return;
    }

    const proceed = () => {
      const selectedOptions: CartLineOption[] = item.optionGroups.flatMap((g) =>
        (selected[g.id] ?? []).map((optionId) => {
          const opt = g.options.find((o) => o.id === optionId)!;
          return {
            groupName: g.name,
            groupNameAr: g.nameAr,
            optionId: opt.id,
            optionName: opt.name,
            optionNameAr: opt.nameAr,
            priceDelta: toNumber(opt.priceDelta),
          };
        })
      );

      addItem({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantNameAr: restaurant.nameAr,
        restaurantSlug: restaurant.slug,
        menuItemId: item.id,
        name: item.name,
        nameAr: item.nameAr,
        imageUrl: item.imageUrl,
        basePrice,
        selectedOptions,
        quantity,
      });
      onClose();
    };

    if (currentRestaurantId && currentRestaurantId !== restaurant.id) {
      if (window.confirm(t("cart.switchRestaurantConfirm", { restaurant: currentRestaurantName }))) proceed();
      return;
    }
    proceed();
  }

  return (
    <Modal open onClose={onClose} title={pick(item.name, item.nameAr)} size="sm">
      <div className="flex flex-col gap-4">
        {(item.description || item.descriptionAr) && <p className="text-sm text-neutral-600">{pick(item.description ?? "", item.descriptionAr ?? "")}</p>}

        {item.optionGroups.map((group) => (
          <div key={group.id}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800">{pick(group.name, group.nameAr)}</span>
              <span className="text-xs text-neutral-400">
                {group.isRequired ? t("restaurantDetail.requiredChoice") : t("restaurantDetail.optionalChoice", { max: group.maxSelect })}
              </span>
            </div>
            <div className="flex flex-col gap-1.5" data-testid="option-group-choices">
              {group.options.map((opt) => {
                const checked = (selected[group.id] ?? []).includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${checked ? "border-brand-500 bg-brand-50" : "border-neutral-200"}`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type={group.maxSelect === 1 ? "radio" : "checkbox"}
                        checked={checked}
                        onChange={() => toggleOption(group.id, opt.id, group.maxSelect)}
                        className="accent-brand-600"
                      />
                      {pick(opt.name, opt.nameAr)}
                    </span>
                    {toNumber(opt.priceDelta) > 0 && <span className="text-neutral-500">+{currency(opt.priceDelta)}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
          <span className="text-sm font-medium text-neutral-700">{t("restaurantDetail.quantity")}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              data-testid="quantity-decrement"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-100"
            >
              <Minus size={14} />
            </button>
            <span className="w-4 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              data-testid="quantity-increment"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-100"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <Button onClick={handleAdd} fullWidth size="lg">
          {t("restaurantDetail.addToCart")} · {currency(unitPrice * quantity)}
        </Button>
      </div>
    </Modal>
  );
}
