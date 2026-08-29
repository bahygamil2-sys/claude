import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCategories, useRestaurants } from "./restaurantsApi";
import { RestaurantCard } from "./RestaurantCard";
import { Spinner } from "@/components/Spinner";
import { Select } from "@/components/Input";
import { useLocalized } from "@/hooks/useLocalized";

const CITIES = ["Cairo", "Dubai", "Riyadh"];

export default function RestaurantListPage() {
  const { t } = useTranslation("customer");
  const pick = useLocalized();
  const [params, setParams] = useSearchParams();
  const categories = useCategories();

  const filters = {
    search: params.get("search") ?? undefined,
    city: params.get("city") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    sort: (params.get("sort") as "rating" | "deliveryTime" | "minOrder" | null) ?? "rating",
    page: Number(params.get("page") ?? 1),
    pageSize: 20,
  };

  const restaurants = useRestaurants(filters);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-5 text-xl font-bold text-neutral-900">{t("restaurantList.title")}</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select value={filters.city ?? ""} onChange={(e) => updateParam("city", e.target.value)} aria-label={t("restaurantList.filterCity")}>
          <option value="">{t("restaurantList.allCities")}</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={filters.categoryId ?? ""}
          onChange={(e) => updateParam("categoryId", e.target.value)}
          aria-label={t("restaurantList.filterCategory")}
        >
          <option value="">{t("restaurantList.allCategories")}</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {pick(c.name, c.nameAr)}
            </option>
          ))}
        </Select>
        <Select value={filters.sort} onChange={(e) => updateParam("sort", e.target.value)} className="col-span-2 sm:col-span-2" aria-label={t("restaurantList.sortBy")}>
          <option value="rating">{t("restaurantList.sortRating")}</option>
          <option value="deliveryTime">{t("restaurantList.sortDeliveryTime")}</option>
          <option value="minOrder">{t("restaurantList.sortMinOrder")}</option>
        </Select>
      </div>

      {restaurants.isLoading ? (
        <Spinner />
      ) : restaurants.data && restaurants.data.items.length > 0 ? (
        <>
          <p className="mb-3 text-sm text-neutral-500">{t("restaurantList.resultsCount", { count: restaurants.data.total })}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {restaurants.data.items.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
          {restaurants.data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: restaurants.data.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParam("page", String(p))}
                  className={`h-8 w-8 rounded-full text-sm font-medium ${p === filters.page ? "bg-brand-600 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="py-16 text-center text-neutral-500">{t("restaurantList.noResults")}</p>
      )}
    </div>
  );
}
