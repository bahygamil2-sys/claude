import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";
import { useOrder, useUpdateOrderStatus } from "@/features/orders/ordersApi";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { NEXT_STATUS } from "@/lib/orderStatusFlow";
import { FullPageSpinner } from "@/components/Spinner";
import { OrderStatusBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";

const TIMELINE_ORDER = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export default function RestaurantOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(["restaurant", "customer", "common"]);
  const pick = useLocalized();
  const currency = useCurrency();

  const orderQuery = useOrder(id);
  const updateStatus = useUpdateOrderStatus();

  if (orderQuery.isLoading) return <FullPageSpinner />;
  if (!orderQuery.data) return <PlaceholderPage title={t("customer:orderDetail.notFound")} />;

  const order = orderQuery.data;
  const next = NEXT_STATUS[order.status];

  async function advance() {
    if (!id || !next) return;
    try {
      await updateStatus.mutateAsync({ id, status: next });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link to="/restaurant-dashboard/orders" className="text-sm text-neutral-500 hover:underline">
        ← {t("ordersFeed.title")}
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">{order.orderNumber}</h1>
          <p className="text-sm text-neutral-500">{new Date(order.createdAt).toLocaleString(i18n.language)}</p>
        </div>
        <OrderStatusBadge status={order.status} label={t(`common:orderStatus.${order.status}`)} />
      </div>

      {next && (
        <Button onClick={advance} loading={updateStatus.isPending} fullWidth size="lg">
          {t("ordersFeed.advanceTo", { status: t(`common:orderStatus.${next}`) })}
        </Button>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-neutral-800">{t("ordersFeed.customer")}</h2>
        <p className="text-sm text-neutral-700">{order.customer?.name}</p>
        {order.customer?.phone && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
            <Phone size={13} />
            {order.customer.phone}
          </p>
        )}
        <p className="mt-2 text-sm text-neutral-600">
          {order.deliveryAddressLine}, {order.deliveryCity}
        </p>
        {order.notes && <p className="mt-1 text-sm italic text-neutral-500">"{order.notes}"</p>}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("customer:orderDetail.itemsTitle")}</h2>
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="text-neutral-700">
                  {item.quantity}× {pick(item.nameSnapshot, item.nameArSnapshot)}
                </span>
                {item.selectedOptionsSnapshot && item.selectedOptionsSnapshot.length > 0 && (
                  <p className="text-xs text-neutral-400">{item.selectedOptionsSnapshot.map((o) => pick(o.optionName, o.optionNameAr)).join(", ")}</p>
                )}
              </div>
              <span className="text-neutral-600">{currency(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1 border-t border-neutral-100 pt-3 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>{t("customer:cart.subtotal")}</span>
            <span>{currency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>{t("customer:cart.deliveryFee")}</span>
            <span>{currency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-neutral-900">
            <span>{t("customer:cart.total")}</span>
            <span>{currency(order.total)}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          {order.paymentMethod === "CASH" ? t("customer:checkout.cash") : t("customer:checkout.cardMock")} · {t(`common:paymentStatus.${order.paymentStatus}`)}
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("customer:orderDetail.statusTimeline")}</h2>
        <ol className="flex flex-col gap-3">
          {TIMELINE_ORDER.map((status) => {
            const entry = order.statusHistory.find((h) => h.status === status);
            return (
              <li key={status} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${entry ? "bg-brand-600" : "bg-neutral-200"}`} />
                <span className={`flex-1 text-sm ${entry ? "font-medium text-neutral-800" : "text-neutral-400"}`}>{t(`common:orderStatus.${status}`)}</span>
                {entry && <span className="text-xs text-neutral-400">{new Date(entry.changedAt).toLocaleTimeString(i18n.language)}</span>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
