import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PackageOpen } from "lucide-react";
import { useMyOrders } from "./ordersApi";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { Spinner } from "@/components/Spinner";
import { OrderStatusBadge } from "@/components/Badge";
import { Select } from "@/components/Input";
import type { OrderStatus } from "@/types/api";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function CustomerOrdersListPage() {
  const { t, i18n } = useTranslation("customer");
  const pick = useLocalized();
  const currency = useCurrency();
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as OrderStatus | null) ?? undefined;

  const ordersQuery = useMyOrders({ status, pageSize: 30 });

  function updateStatus(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("status", value);
    else next.delete("status");
    setParams(next);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">{t("orders.title")}</h1>
        <Select value={status ?? ""} onChange={(e) => updateStatus(e.target.value)} className="w-auto" aria-label={t("orders.filterStatus")}>
          <option value="">{t("orders.allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`common:orderStatus.${s}`)}
            </option>
          ))}
        </Select>
      </div>

      {ordersQuery.isLoading ? (
        <Spinner />
      ) : ordersQuery.data && ordersQuery.data.items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {ordersQuery.data.items.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-sm"
            >
              <div>
                <p className="font-semibold text-neutral-900">{pick(order.restaurant.name, order.restaurant.nameAr)}</p>
                <p className="text-xs text-neutral-500">{t("orders.placedOn", { date: new Date(order.createdAt).toLocaleString(i18n.language) })}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {order.items.length} × {order.orderNumber}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <OrderStatusBadge status={order.status} label={t(`common:orderStatus.${order.status}`)} />
                <span className="text-sm font-semibold text-neutral-800">{currency(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-neutral-400">
          <PackageOpen size={36} />
          {t("orders.empty")}
        </div>
      )}
    </div>
  );
}
