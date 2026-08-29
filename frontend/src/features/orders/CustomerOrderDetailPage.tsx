import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, MapPinned, Star } from "lucide-react";
import { useOrder, useCancelOrder, useCreateReview } from "./ordersApi";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/Button";
import { Spinner, FullPageSpinner } from "@/components/Spinner";
import { OrderStatusBadge } from "@/components/Badge";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { toast } from "@/store/toastStore";
import type { OrderStatus } from "@/types/api";

const TIMELINE_ORDER: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"];
const TRACKABLE_STATUSES: OrderStatus[] = ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];
const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED"];

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation("customer");
  const navigate = useNavigate();
  const pick = useLocalized();
  const currency = useCurrency();

  const orderQuery = useOrder(id);
  const cancelOrder = useCancelOrder();
  const createReview = useCreateReview();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (orderQuery.isLoading) return <FullPageSpinner />;
  if (!orderQuery.data) return <PlaceholderPage title={t("orderDetail.notFound")} />;

  const order = orderQuery.data;

  async function onCancel() {
    if (!id || !window.confirm(t("orderDetail.cancelConfirm"))) return;
    try {
      await cancelOrder.mutateAsync({ id });
      toast.success(t("common:orderStatus.CANCELLED"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onSubmitReview() {
    if (!id) return;
    try {
      await createReview.mutateAsync({ orderId: id, rating, comment: comment || undefined });
      toast.success(t("orderDetail.reviewSubmitted"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link to="/orders" className="mb-4 inline-block text-sm text-neutral-500 hover:underline">
        ← {t("orderDetail.backToOrders")}
      </Link>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">{pick(order.restaurant.name, order.restaurant.nameAr)}</h1>
          <p className="text-sm text-neutral-500">{order.orderNumber}</p>
        </div>
        <OrderStatusBadge status={order.status} label={t(`common:orderStatus.${order.status}`)} />
      </div>

      {TRACKABLE_STATUSES.includes(order.status) && (
        <Link
          to={`/orders/${order.id}/tracking`}
          className="mb-5 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-4 text-brand-700"
        >
          <span className="flex items-center gap-2 font-medium">
            <MapPinned size={18} />
            {t("orders.trackLive")}
          </span>
          <ChevronRight size={18} />
        </Link>
      )}

      <section className="mb-5 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("orderDetail.statusTimeline")}</h2>
        <ol className="flex flex-col gap-3">
          {TIMELINE_ORDER.map((status) => {
            const historyEntry = order.statusHistory.find((h) => h.status === status);
            return (
              <li key={status} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${historyEntry ? "bg-brand-600" : "bg-neutral-200"}`} />
                <span className={`flex-1 text-sm ${historyEntry ? "font-medium text-neutral-800" : "text-neutral-400"}`}>
                  {t(`common:orderStatus.${status}`)}
                </span>
                {historyEntry && <span className="text-xs text-neutral-400">{new Date(historyEntry.changedAt).toLocaleTimeString(i18n.language)}</span>}
              </li>
            );
          })}
          {order.status === "CANCELLED" && (
            <li className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
              <span className="flex-1 text-sm font-medium text-red-600">{t("common:orderStatus.CANCELLED")}</span>
              {order.cancelledAt && <span className="text-xs text-neutral-400">{new Date(order.cancelledAt).toLocaleTimeString(i18n.language)}</span>}
            </li>
          )}
        </ol>
      </section>

      <section className="mb-5 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("orderDetail.itemsTitle")}</h2>
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
            <span>{t("cart.subtotal")}</span>
            <span>{currency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>{t("cart.deliveryFee")}</span>
            <span>{currency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-neutral-900">
            <span>{t("cart.total")}</span>
            <span>{currency(order.total)}</span>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-xl border border-neutral-200 bg-white p-4 text-sm">
        <h2 className="mb-2 font-semibold text-neutral-800">{t("orderDetail.deliveryInfo")}</h2>
        <p className="text-neutral-600">{order.deliveryAddressLine}, {order.deliveryCity}</p>
        {order.notes && <p className="mt-1 text-neutral-500">{order.notes}</p>}
        <h2 className="mb-1 mt-3 font-semibold text-neutral-800">{t("orderDetail.paymentInfo")}</h2>
        <p className="text-neutral-600">
          {order.paymentMethod === "CASH" ? t("checkout.cash") : t("checkout.cardMock")} · {t(`common:paymentStatus.${order.paymentStatus}`)}
        </p>
      </section>

      {CUSTOMER_CANCELLABLE.includes(order.status) && (
        <Button variant="outline" fullWidth loading={cancelOrder.isPending} onClick={onCancel} className="mb-5">
          {t("orderDetail.cancelOrder")}
        </Button>
      )}

      {order.status === "DELIVERED" && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          {order.review ? (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Star size={16} className="text-amber-500" fill="currentColor" />
              {t("orderDetail.reviewSubmitted")}
            </div>
          ) : (
            <>
              <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("orderDetail.leaveReview")}</h2>
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`rate ${n}`}>
                    <Star size={24} className={n <= rating ? "text-amber-500" : "text-neutral-200"} fill="currentColor" />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("orderDetail.comment")}
                rows={2}
                className="mb-3 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              {createReview.isPending ? <Spinner /> : <Button onClick={onSubmitReview}>{t("orderDetail.submitReview")}</Button>}
            </>
          )}
        </section>
      )}

      {order.status === "CANCELLED" && (
        <Button variant="outline" fullWidth onClick={() => navigate("/restaurants")}>
          {t("cart.browseRestaurants")}
        </Button>
      )}
    </div>
  );
}
