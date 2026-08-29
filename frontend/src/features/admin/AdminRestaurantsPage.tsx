import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminRestaurants, useUpdateRestaurantStatus } from "./adminApi";
import { useCategories } from "@/features/restaurants/restaurantsApi";
import { useLocalized } from "@/hooks/useLocalized";
import { FilterBar } from "@/components/FilterBar";
import { Input, Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";
import { RestaurantStatusBadge } from "@/components/Badge";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { RestaurantStatus } from "@/types/api";

const STATUSES: RestaurantStatus[] = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

export default function AdminRestaurantsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const pick = useLocalized();
  const categoriesQuery = useCategories();
  const [status, setStatus] = useState<RestaurantStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const restaurants = useAdminRestaurants({ status: status || undefined, categoryId: categoryId || undefined, search: search || undefined, page, pageSize: 20 });
  const updateStatus = useUpdateRestaurantStatus();

  async function setRestaurantStatus(id: string, next: RestaurantStatus) {
    try {
      await updateStatus.mutateAsync({ id, status: next });
      toast.success(t(`restaurantStatusUpdated.${next}`));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  function actionsFor(id: string, current: RestaurantStatus) {
    switch (current) {
      case "PENDING":
        return (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" loading={updateStatus.isPending} onClick={() => setRestaurantStatus(id, "REJECTED")}>
              {t("common:actions.reject")}
            </Button>
            <Button size="sm" loading={updateStatus.isPending} onClick={() => setRestaurantStatus(id, "APPROVED")}>
              {t("common:actions.approve")}
            </Button>
          </div>
        );
      case "APPROVED":
        return (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" loading={updateStatus.isPending} onClick={() => setRestaurantStatus(id, "SUSPENDED")}>
              {t("common:actions.suspend")}
            </Button>
          </div>
        );
      case "SUSPENDED":
      case "REJECTED":
        return (
          <div className="flex justify-end">
            <Button size="sm" loading={updateStatus.isPending} onClick={() => setRestaurantStatus(id, "APPROVED")}>
              {t("common:actions.reactivate")}
            </Button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-neutral-900">{t("restaurants.title")}</h1>

      <FilterBar>
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder={t("common:actions.search")}
          className="w-48"
        />
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as RestaurantStatus | "");
          }}
          className="w-auto"
        >
          <option value="">{t("restaurants.allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`common:restaurantStatus.${s}`)}
            </option>
          ))}
        </Select>
        <Select
          value={categoryId}
          onChange={(e) => {
            setPage(1);
            setCategoryId(e.target.value);
          }}
          className="w-auto"
        >
          <option value="">{t("restaurants.allCategories")}</option>
          {categoriesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {pick(c.name, c.nameAr)}
            </option>
          ))}
        </Select>
      </FilterBar>

      {restaurants.isLoading ? (
        <Spinner />
      ) : restaurants.data && restaurants.data.items.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                  <th className="p-3 text-start font-medium">{t("restaurants.name")}</th>
                  <th className="p-3 text-start font-medium">{t("restaurants.owner")}</th>
                  <th className="p-3 text-start font-medium">{t("restaurants.city")}</th>
                  <th className="p-3 text-start font-medium">{t("restaurants.status")}</th>
                  <th className="p-3 text-end font-medium" />
                </tr>
              </thead>
              <tbody>
                {restaurants.data.items.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="p-3">
                      <Link to={`/admin/restaurants/${r.id}`} className="font-medium text-neutral-800 hover:text-brand-600">
                        {pick(r.name, r.nameAr)}
                      </Link>
                    </td>
                    <td className="p-3 text-neutral-600">
                      <p>{r.owner.name}</p>
                      <p className="text-xs text-neutral-400">{r.owner.email}</p>
                    </td>
                    <td className="p-3 text-neutral-600">{r.city}</td>
                    <td className="p-3">
                      <RestaurantStatusBadge status={r.status} label={t(`common:restaurantStatus.${r.status}`)} />
                    </td>
                    <td className="p-3">{actionsFor(r.id, r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={restaurants.data.page} totalPages={restaurants.data.totalPages} total={restaurants.data.total} onChange={setPage} />
        </div>
      ) : (
        <p className="py-16 text-center text-neutral-400">{t("common:state.empty")}</p>
      )}
    </div>
  );
}
