import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore, cartLineTotal, cartSubtotal } from "@/store/cartStore";
import { useRestaurant } from "@/features/restaurants/restaurantsApi";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { toNumber } from "@/lib/money";
import { Button } from "@/components/Button";

export default function CartPage() {
  const { t } = useTranslation("customer");
  const navigate = useNavigate();
  const pick = useLocalized();
  const currency = useCurrency();

  const { restaurantId, restaurantName, restaurantNameAr, lines, updateQuantity, removeLine } = useCartStore();
  const restaurantQuery = useRestaurant(restaurantId ?? undefined);

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
        <ShoppingBag size={40} className="text-neutral-300" />
        <h1 className="text-lg font-semibold text-neutral-800">{t("cart.empty")}</h1>
        <p className="text-sm text-neutral-500">{t("cart.emptyHint")}</p>
        <Link to="/restaurants">
          <Button className="mt-2">{t("cart.browseRestaurants")}</Button>
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  const deliveryFee = restaurantQuery.data ? toNumber(restaurantQuery.data.deliveryFee) : 0;
  const minOrder = restaurantQuery.data ? toNumber(restaurantQuery.data.minOrderAmount) : 0;
  const total = subtotal + deliveryFee;
  const meetsMinimum = subtotal >= minOrder;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-neutral-900">{t("cart.title")}</h1>
      <p className="mb-5 text-sm text-neutral-500">{t("cart.orderFrom", { restaurant: pick(restaurantName ?? "", restaurantNameAr ?? "") })}</p>

      <div className="flex flex-col gap-3">
        {lines.map((line) => (
          <div key={line.lineId} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3.5">
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{pick(line.name, line.nameAr)}</p>
              {line.selectedOptions.length > 0 && (
                <p className="mt-0.5 text-xs text-neutral-500">{line.selectedOptions.map((o) => pick(o.optionName, o.optionNameAr)).join(", ")}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-100"
                >
                  <Minus size={13} />
                </button>
                <span className="w-4 text-center text-sm font-medium">{line.quantity}</span>
                <button
                  onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-100"
                >
                  <Plus size={13} />
                </button>
                <button onClick={() => removeLine(line.lineId)} className="ms-2 flex items-center gap-1 text-xs text-red-500 hover:underline">
                  <Trash2 size={13} />
                  {t("cart.remove")}
                </button>
              </div>
            </div>
            <span className="font-semibold text-neutral-800">{currency(cartLineTotal(line))}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex justify-between text-sm text-neutral-600">
          <span>{t("cart.subtotal")}</span>
          <span>{currency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-neutral-600">
          <span>{t("cart.deliveryFee")}</span>
          <span>{currency(deliveryFee)}</span>
        </div>
        <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-bold text-neutral-900">
          <span>{t("cart.total")}</span>
          <span>{currency(total)}</span>
        </div>
      </div>

      {!meetsMinimum && restaurantQuery.data && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
          {t("cart.minOrderNotMet", { amount: currency(minOrder - subtotal), min: currency(minOrder) })}
        </p>
      )}

      <Button fullWidth size="lg" className="mt-4" disabled={!meetsMinimum} onClick={() => navigate("/checkout")}>
        {t("cart.checkout")}
      </Button>
    </div>
  );
}
