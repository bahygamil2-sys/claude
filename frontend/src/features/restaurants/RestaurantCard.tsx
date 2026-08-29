import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Star } from "lucide-react";
import { useLocalized } from "@/hooks/useLocalized";
import { useCurrency } from "@/hooks/useCurrency";
import { toNumber } from "@/lib/money";
import { Badge } from "@/components/Badge";
import type { Restaurant } from "@/types/api";

export function RestaurantCoverPlaceholder({ name, className }: { name: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-extrabold text-white ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useTranslation("customer");
  const pick = useLocalized();
  const currency = useCurrency();

  return (
    <Link
      to={`/restaurants/${restaurant.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-32 w-full overflow-hidden">
        {restaurant.coverImageUrl ? (
          <img src={restaurant.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <RestaurantCoverPlaceholder name={pick(restaurant.name, restaurant.nameAr)} className="h-full w-full" />
        )}
        {!restaurant.isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Badge tone="danger">{t("restaurantList.closed")}</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900">{pick(restaurant.name, restaurant.nameAr)}</h3>
          <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-amber-500">
            <Star size={14} fill="currentColor" />
            {toNumber(restaurant.ratingAvg).toFixed(1)}
          </span>
        </div>
        <p className="text-xs text-neutral-500">{restaurant.categories.map((c) => pick(c.name, c.nameAr)).join(" · ")}</p>
        <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {t("restaurantList.deliveryTime", { minutes: restaurant.avgPreparationTimeMinutes })}
          </span>
          <span>{t("restaurantList.minOrder", { amount: currency(restaurant.minOrderAmount) })}</span>
        </div>
      </div>
    </Link>
  );
}
