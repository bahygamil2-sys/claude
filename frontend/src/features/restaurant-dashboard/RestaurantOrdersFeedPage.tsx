import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useRestaurantDashboard } from "./RestaurantDashboardContext";
import { useRestaurantOrdersFeed } from "./restaurantOwnerApi";
import { useUpdateOrderStatus } from "@/features/orders/ordersApi";
import { useRestaurantRoom } from "@/hooks/useRestaurantRoom";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { useCurrency } from "@/hooks/useCurrency";
import { NEXT_STATUS } from "@/lib/orderStatusFlow";
import { Spinner } from "@/components/Spinner";
import { OrderStatusBadge } from "@/components/Badge";
import { Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { OrderStatus } from "@/types/api";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function RestaurantOrdersFeedPage() {
  const { t, i18n } = useTranslation(["restaurant", "common"]);
  const currency = useCurrency();
  const queryClient = useQueryClient();
  const { selected } = useRestaurantDashboard();
  const [status, setStatus] = useState<OrderStatus | "">("");

  const feed = useRestaurantOrdersFeed(selected.id, { status: status || undefined, pageSize: 50 });
  const updateStatus = useUpdateOrderStatus();

  useRestaurantRoom(selected.id);
  useSocketEvent<{ orderId: string; orderNumber: string; restaurantId: string }>(
    "order:new",
    (payload) => {
      if (payload.restaurantId !== selected.id) return;
      toast.info(t("ordersFeed.newOrderToast", { orderNumber: payload.orderNumber }));
      void queryClient.invalidateQueries({ queryKey: ["restaurant-orders", selected.id] });
    },
    [selected.id, queryClient]
  );
  useSocketEvent<{ orderId: string }>(
    "order:statusChanged",
    () => void queryClient.invalidateQueries({ queryKey: ["restaurant-orders", selected.id] }),
    [selected.id, queryClient]
  );

  async function advance(orderId: string, next: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: next });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-neutral-900">{t("ordersFeed.title")}</h1>
        <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "")} className="w-auto" aria-label={t("common:actions.filter")}>
          <option value="">{t("common:actions.filters")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`common:orderStatus.${s}`)}
            </option>
          ))}
        </Select>
      </div>

      {feed.isLoading ? (
        <Spinner />
      ) : feed.data && feed.data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-start text-xs text-neutral-500">
                <th className="p-3 text-start font-medium">{t("ordersFeed.customer")}</th>
                <th className="p-3 text-start font-medium">{t("ordersFeed.items")}</th>
                <th className="p-3 text-start font-medium">{t("ordersFeed.total")}</th>
                <th className="p-3 text-start font-medium">{t("ordersFeed.placed")}</th>
                <th className="p-3 text-start font-medium" />
                <th className="p-3 text-end font-medium" />
              </tr>
            </thead>
            <tbody>
              {feed.data.items.map((order) => {
                const next = NEXT_STATUS[order.status];
                return (
                  <tr key={order.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="p-3">
                      <Link to={`/restaurant-dashboard/orders/${order.id}`} className="font-medium text-neutral-800 hover:text-brand-600">
                        {order.customer?.name}
                      </Link>
                      <p className="text-xs text-neutral-400">{order.orderNumber}</p>
                    </td>
                    <td className="p-3 text-neutral-600">{order.items.length}</td>
                    <td className="p-3 font-medium text-neutral-800">{currency(order.total)}</td>
                    <td className="p-3 text-xs text-neutral-500">{new Date(order.createdAt).toLocaleString(i18n.language)}</td>
                    <td className="p-3">
                      <OrderStatusBadge status={order.status} label={t(`common:orderStatus.${order.status}`)} />
                    </td>
                    <td className="p-3 text-end">
                      {next && (
                        <Button size="sm" variant="outline" loading={updateStatus.isPending} onClick={() => advance(order.id, next)}>
                          {t("ordersFeed.advanceTo", { status: t(`common:orderStatus.${next}`) })}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-16 text-center text-neutral-400">{t("ordersFeed.empty")}</p>
      )}
    </div>
  );
}
