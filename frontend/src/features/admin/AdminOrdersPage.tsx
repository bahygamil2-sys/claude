import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminOrders, useAdminRestaurants } from "./adminApi";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { FilterBar } from "@/components/FilterBar";
import { DateRangePicker, presetRange, type DateRange } from "@/components/DateRangePicker";
import { Select } from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";
import { OrderStatusBadge } from "@/components/Badge";
import type { OrderStatus } from "@/types/api";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const pick = useLocalized();
  const currency = useCurrency();
  const [range, setRange] = useState<DateRange>(presetRange("30d"));
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [restaurantId, setRestaurantId] = useState("");
  const [page, setPage] = useState(1);

  const restaurantsQuery = useAdminRestaurants({ pageSize: 50 });
  const orders = useAdminOrders({ ...range, status: status || undefined, restaurantId: restaurantId || undefined, page, pageSize: 20 });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-neutral-900">{t("orders.title")}</h1>

      <FilterBar>
        <DateRangePicker value={range} onChange={setRange} />
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as OrderStatus | "");
          }}
          className="w-auto"
        >
          <option value="">{t("common:actions.filters")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`common:orderStatus.${s}`)}
            </option>
          ))}
        </Select>
        <Select
          value={restaurantId}
          onChange={(e) => {
            setPage(1);
            setRestaurantId(e.target.value);
          }}
          className="w-auto"
        >
          <option value="">{t("orders.allRestaurants")}</option>
          {restaurantsQuery.data?.items.map((r) => (
            <option key={r.id} value={r.id}>
              {pick(r.name, r.nameAr)}
            </option>
          ))}
        </Select>
      </FilterBar>

      {orders.isLoading ? (
        <Spinner />
      ) : orders.data && orders.data.items.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                  <th className="p-3 text-start font-medium">{t("orders.orderNumber")}</th>
                  <th className="p-3 text-start font-medium">{t("orders.customer")}</th>
                  <th className="p-3 text-start font-medium">{t("orders.restaurant")}</th>
                  <th className="p-3 text-start font-medium">{t("orders.city")}</th>
                  <th className="p-3 text-start font-medium">{t("orders.total")}</th>
                  <th className="p-3 text-start font-medium">{t("orders.status")}</th>
                  <th className="p-3 text-start font-medium">{t("orders.placed")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.items.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="p-3 font-medium text-neutral-800">{o.orderNumber}</td>
                    <td className="p-3 text-neutral-600">{o.customer.name}</td>
                    <td className="p-3 text-neutral-600">{pick(o.restaurant.name, o.restaurant.nameAr)}</td>
                    <td className="p-3 text-neutral-600">{o.restaurant.city}</td>
                    <td className="p-3 font-medium text-neutral-800">{currency(o.total)}</td>
                    <td className="p-3">
                      <OrderStatusBadge status={o.status} label={t(`common:orderStatus.${o.status}`)} />
                    </td>
                    <td className="p-3 text-xs text-neutral-500">{new Date(o.createdAt).toLocaleString(i18n.language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={orders.data.page} totalPages={orders.data.totalPages} total={orders.data.total} onChange={setPage} />
        </div>
      ) : (
        <p className="py-16 text-center text-neutral-400">{t("common:state.empty")}</p>
      )}
    </div>
  );
}
