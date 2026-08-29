import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, Clock, Wallet, Truck } from "lucide-react";
import clsx from "clsx";
import { useRestaurant, useRestaurantMenu, useRestaurantReviews } from "./restaurantsApi";
import { RestaurantCoverPlaceholder } from "./RestaurantCard";
import { MenuItemCard } from "./MenuItemCard";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { toNumber } from "@/lib/money";
import { Spinner, FullPageSpinner } from "@/components/Spinner";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function RestaurantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("customer");
  const pick = useLocalized();
  const currency = useCurrency();
  const [tab, setTab] = useState<"menu" | "reviews">("menu");

  const restaurantQuery = useRestaurant(slug);
  const menuQuery = useRestaurantMenu(slug);
  const reviewsQuery = useRestaurantReviews(tab === "reviews" ? slug : undefined);

  if (restaurantQuery.isLoading) return <FullPageSpinner />;
  if (!restaurantQuery.data) return <PlaceholderPage title={t("restaurantDetail.notFound")} />;

  const restaurant = restaurantQuery.data;

  return (
    <div className="pb-16">
      <div className="relative h-48 w-full overflow-hidden sm:h-64">
        {restaurant.coverImageUrl ? (
          <img src={restaurant.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <RestaurantCoverPlaceholder name={pick(restaurant.name, restaurant.nameAr)} className="h-full w-full text-5xl" />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="-mt-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{pick(restaurant.name, restaurant.nameAr)}</h1>
              <p className="text-sm text-neutral-500">{restaurant.categories.map((c) => pick(c.name, c.nameAr)).join(" · ")}</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-600">
              <Star size={15} fill="currentColor" />
              {toNumber(restaurant.ratingAvg).toFixed(1)}
              <span className="font-normal text-amber-500">({restaurant.ratingCount})</span>
            </span>
          </div>

          {!restaurant.isOpen && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{t("restaurantDetail.closed")}</p>}

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4 text-center text-xs text-neutral-600">
            <div className="flex flex-col items-center gap-1">
              <Clock size={16} className="text-neutral-400" />
              {t("restaurantDetail.deliveryTime")}
              <span className="font-semibold text-neutral-800">{t("common:time.minutes", { count: restaurant.avgPreparationTimeMinutes })}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck size={16} className="text-neutral-400" />
              {t("restaurantDetail.deliveryFee")}
              <span className="font-semibold text-neutral-800">{currency(restaurant.deliveryFee)}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Wallet size={16} className="text-neutral-400" />
              {t("restaurantDetail.minOrder")}
              <span className="font-semibold text-neutral-800">{currency(restaurant.minOrderAmount)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-1 border-b border-neutral-200">
          {(["menu", "reviews"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={clsx(
                "border-b-2 px-4 py-2.5 text-sm font-medium",
                tab === tabKey ? "border-brand-600 text-brand-700" : "border-transparent text-neutral-500 hover:text-neutral-700"
              )}
            >
              {tabKey === "menu" ? t("restaurantDetail.menuTab") : t("restaurantDetail.reviewsTab", { count: restaurant.ratingCount })}
            </button>
          ))}
        </div>

        {tab === "menu" ? (
          menuQuery.isLoading ? (
            <Spinner className="mt-8" />
          ) : (
            <div className="mt-6 flex flex-col gap-8">
              {menuQuery.data?.menuCategories.map((category) => (
                <div key={category.id}>
                  <h2 className="mb-3 text-base font-bold text-neutral-900">{pick(category.name, category.nameAr)}</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {category.menuItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} restaurant={restaurant} />
                    ))}
                  </div>
                </div>
              ))}
              {menuQuery.data?.uncategorized.map((item) => <MenuItemCard key={item.id} item={item} restaurant={restaurant} />)}
            </div>
          )
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {reviewsQuery.isLoading ? (
              <Spinner />
            ) : reviewsQuery.data && reviewsQuery.data.items.length > 0 ? (
              reviewsQuery.data.items.map((review) => (
                <div key={review.id} className="rounded-lg border border-neutral-200 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-800">{review.customer?.name}</span>
                    <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
                      <Star size={13} fill="currentColor" />
                      {review.rating}
                    </span>
                  </div>
                  {review.comment && <p className="mt-1 text-sm text-neutral-600">{review.comment}</p>}
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-neutral-400">{t("restaurantDetail.noReviewsYet")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
