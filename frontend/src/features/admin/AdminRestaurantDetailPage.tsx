import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Clock, MapPin, Phone, Star } from "lucide-react";
import { useRestaurant, useRestaurantMenu } from "@/features/restaurants/restaurantsApi";
import { useUpdateRestaurantStatus } from "./adminApi";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { Spinner, FullPageSpinner } from "@/components/Spinner";
import { Button } from "@/components/Button";
import { RestaurantStatusBadge } from "@/components/Badge";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { RestaurantStatus } from "@/types/api";

export default function AdminRestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["admin", "common"]);
  const pick = useLocalized();
  const currency = useCurrency();
  const navigate = useNavigate();

  const restaurantQuery = useRestaurant(id);
  const menuQuery = useRestaurantMenu(id);
  const updateStatus = useUpdateRestaurantStatus();

  if (restaurantQuery.isLoading) return <FullPageSpinner />;
  if (!restaurantQuery.data) return <p className="py-16 text-center text-neutral-400">{t("common:state.notFound")}</p>;

  const restaurant = restaurantQuery.data;

  async function setStatus(next: RestaurantStatus) {
    if (!id) return;
    try {
      await updateStatus.mutateAsync({ id, status: next });
      toast.success(t(`restaurantStatusUpdated.${next}`));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button onClick={() => navigate("/admin/restaurants")} className="flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
        <ArrowLeft size={15} className="rtl:rotate-180" />
        {t("common:actions.back")}
      </button>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="h-32 bg-neutral-100">
          {restaurant.coverImageUrl && <img src={restaurant.coverImageUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt="" className="h-14 w-14 rounded-xl border border-neutral-200 object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-neutral-100" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900">{pick(restaurant.name, restaurant.nameAr)}</h1>
                <RestaurantStatusBadge status={restaurant.status} label={t(`common:restaurantStatus.${restaurant.status}`)} />
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                <MapPin size={13} /> {restaurant.addressLine}, {restaurant.city}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {restaurant.status === "PENDING" && (
              <>
                <Button variant="outline" loading={updateStatus.isPending} onClick={() => setStatus("REJECTED")}>
                  {t("common:actions.reject")}
                </Button>
                <Button loading={updateStatus.isPending} onClick={() => setStatus("APPROVED")}>
                  {t("common:actions.approve")}
                </Button>
              </>
            )}
            {restaurant.status === "APPROVED" && (
              <Button variant="outline" loading={updateStatus.isPending} onClick={() => setStatus("SUSPENDED")}>
                {t("common:actions.suspend")}
              </Button>
            )}
            {(restaurant.status === "SUSPENDED" || restaurant.status === "REJECTED") && (
              <Button loading={updateStatus.isPending} onClick={() => setStatus("APPROVED")}>
                {t("common:actions.reactivate")}
              </Button>
            )}
          </div>
        </div>

        {(restaurant.description || restaurant.descriptionAr) && (
          <p className="border-t border-neutral-100 px-5 py-4 text-sm text-neutral-600">{pick(restaurant.description ?? "", restaurant.descriptionAr ?? "")}</p>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 p-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-400">{t("restaurants.detail.phone")}</p>
            <p className="flex items-center gap-1 text-sm font-medium text-neutral-800">
              <Phone size={13} /> {restaurant.phone}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("restaurants.detail.hours")}</p>
            <p className="flex items-center gap-1 text-sm font-medium text-neutral-800">
              <Clock size={13} /> {restaurant.openTime}–{restaurant.closeTime}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("restaurants.detail.rating")}</p>
            <p className="flex items-center gap-1 text-sm font-medium text-neutral-800">
              <Star size={13} className="fill-amber-400 text-amber-400" /> {Number(restaurant.ratingAvg).toFixed(1)} ({restaurant.ratingCount})
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("restaurants.detail.deliveryFee")}</p>
            <p className="text-sm font-medium text-neutral-800">{currency(restaurant.deliveryFee)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("restaurants.detail.minOrder")}</p>
            <p className="text-sm font-medium text-neutral-800">{currency(restaurant.minOrderAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("restaurants.detail.prepTime")}</p>
            <p className="text-sm font-medium text-neutral-800">{t("common:time.minutes", { count: restaurant.avgPreparationTimeMinutes })}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">{t("restaurants.detail.openNow")}</p>
            <p className="text-sm font-medium text-neutral-800">{restaurant.isOpen ? t("common:state.yes") : t("common:state.no")}</p>
          </div>
        </div>

        {restaurant.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-neutral-100 p-5">
            {restaurant.categories.map((c) => (
              <span key={c.id} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {c.icon} {pick(c.name, c.nameAr)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("restaurants.detail.menuPreview")}</h2>
        {menuQuery.isLoading ? (
          <Spinner />
        ) : menuQuery.data && (menuQuery.data.menuCategories.length > 0 || menuQuery.data.uncategorized.length > 0) ? (
          <div className="flex flex-col gap-2">
            {menuQuery.data.menuCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between border-b border-neutral-100 py-2 text-sm last:border-0">
                <span className="text-neutral-700">{pick(cat.name, cat.nameAr)}</span>
                <span className="text-neutral-400">{t("restaurants.detail.itemCount", { count: cat.menuItems.length })}</span>
              </div>
            ))}
            {menuQuery.data.uncategorized.length > 0 && (
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-neutral-700">{t("menu.noSection", { ns: "restaurant" })}</span>
                <span className="text-neutral-400">{t("restaurants.detail.itemCount", { count: menuQuery.data.uncategorized.length })}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-neutral-400">{t("common:state.empty")}</p>
        )}
      </div>

      <Link to={`/restaurants/${restaurant.slug}`} className="w-fit text-sm text-brand-600 hover:underline">
        {t("restaurants.detail.viewPublicPage")}
      </Link>
    </div>
  );
}
