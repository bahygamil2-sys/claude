import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Plus } from "lucide-react";
import clsx from "clsx";
import { useCartStore, cartLineTotal, cartSubtotal } from "@/store/cartStore";
import { useAddresses } from "@/features/profile/addressesApi";
import { AddressFormModal } from "@/features/profile/AddressFormModal";
import { useCreateOrder } from "@/features/orders/ordersApi";
import { useRestaurant } from "@/features/restaurants/restaurantsApi";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { toNumber } from "@/lib/money";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { toast } from "@/store/toastStore";
import type { PaymentMethod } from "@/types/api";

export default function CheckoutPage() {
  const { t } = useTranslation("customer");
  const navigate = useNavigate();
  const pick = useLocalized();
  const currency = useCurrency();

  const cart = useCartStore();
  const restaurantQuery = useRestaurant(cart.restaurantId ?? undefined);
  const addressesQuery = useAddresses();
  const createOrder = useCreateOrder();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  // Placing an order clears the cart, which would otherwise trip the "cart is empty"
  // redirect below on the same render — this flag tells that guard to stand down.
  const orderJustPlacedRef = useRef(false);

  useEffect(() => {
    if (!addressId && addressesQuery.data && addressesQuery.data.length > 0) {
      setAddressId(addressesQuery.data.find((a) => a.isDefault)?.id ?? addressesQuery.data[0].id);
    }
  }, [addressId, addressesQuery.data]);

  useEffect(() => {
    if (cart.lines.length === 0 && !orderJustPlacedRef.current) navigate("/cart", { replace: true });
  }, [cart.lines.length, navigate]);

  if (cart.lines.length === 0 && !orderJustPlacedRef.current) return null;

  const subtotal = cartSubtotal(cart.lines);
  const deliveryFee = restaurantQuery.data ? toNumber(restaurantQuery.data.deliveryFee) : 0;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    if (!addressId || !cart.restaurantId) return;
    try {
      const order = await createOrder.mutateAsync({
        restaurantId: cart.restaurantId,
        addressId,
        paymentMethod,
        notes: notes || undefined,
        items: cart.lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          selectedOptionIds: line.selectedOptions.map((o) => o.optionId),
        })),
      });
      orderJustPlacedRef.current = true;
      cart.clear();
      toast.success(t("orderConfirmation.subtitle", { orderNumber: order.orderNumber }));
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-neutral-900">{t("checkout.title")}</h1>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800">{t("checkout.deliveryAddress")}</h2>
          <button onClick={() => setShowAddressForm(true)} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            <Plus size={14} />
            {t("checkout.addAddress")}
          </button>
        </div>
        {addressesQuery.data && addressesQuery.data.length > 0 ? (
          <div className="flex flex-col gap-2">
            {addressesQuery.data.map((addr) => (
              <label
                key={addr.id}
                className={clsx(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                  addressId === addr.id ? "border-brand-500 bg-brand-50" : "border-neutral-200"
                )}
              >
                <input type="radio" checked={addressId === addr.id} onChange={() => setAddressId(addr.id)} className="mt-1 accent-brand-600" />
                <MapPin size={16} className="mt-0.5 shrink-0 text-neutral-400" />
                <div className="text-sm">
                  <p className="font-medium text-neutral-800">{addr.label}</p>
                  <p className="text-neutral-500">
                    {addr.street}, {addr.city}
                  </p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-neutral-50 px-3 py-4 text-center text-sm text-neutral-500">{t("checkout.noAddresses")}</p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-800">{t("checkout.paymentMethod")}</h2>
        <div className="grid grid-cols-2 gap-2">
          {(["CASH", "CARD_MOCK"] as const).map((method) => (
            <label
              key={method}
              className={clsx(
                "cursor-pointer rounded-lg border p-3 text-sm font-medium",
                paymentMethod === method ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-200 text-neutral-600"
              )}
            >
              <input type="radio" className="me-2 accent-brand-600" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
              {method === "CASH" ? t("checkout.cash") : t("checkout.cardMock")}
            </label>
          ))}
        </div>
        {paymentMethod === "CARD_MOCK" && <p className="mt-2 text-xs text-neutral-400">{t("checkout.cardMockNote")}</p>}
      </section>

      <section className="mb-6">
        <Textarea label={t("checkout.orderNotes")} placeholder={t("checkout.notesPlaceholder")} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </section>

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("checkout.orderSummary")}</h2>
        <div className="flex flex-col gap-1.5 text-sm">
          {cart.lines.map((line) => (
            <div key={line.lineId} className="flex justify-between text-neutral-600">
              <span>
                {line.quantity}× {pick(line.name, line.nameAr)}
              </span>
              <span>{currency(cartLineTotal(line))}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1 border-t border-neutral-100 pt-3 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>{t("cart.subtotal")}</span>
            <span>{currency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>{t("cart.deliveryFee")}</span>
            <span>{currency(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-neutral-900">
            <span>{t("cart.total")}</span>
            <span>{currency(total)}</span>
          </div>
        </div>
      </section>

      <Button fullWidth size="lg" loading={createOrder.isPending} disabled={!addressId} onClick={placeOrder}>
        {t("checkout.placeOrder")}
      </Button>

      {showAddressForm && <AddressFormModal onClose={() => setShowAddressForm(false)} />}
    </div>
  );
}
