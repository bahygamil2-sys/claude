import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useCategories, useRestaurants } from "@/features/restaurants/restaurantsApi";
import { CategoryPill } from "@/features/restaurants/CategoryPill";
import { RestaurantCard } from "@/features/restaurants/RestaurantCard";
import { Spinner } from "@/components/Spinner";

export default function HomePage() {
  const { t } = useTranslation("customer");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const categories = useCategories();
  const popular = useRestaurants({ sort: "rating", pageSize: 8 });

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    navigate(`/restaurants${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">{t("home.heroTitle")}</h1>
          <p className="mt-2 text-neutral-600">{t("home.heroSubtitle")}</p>
          <form onSubmit={onSearchSubmit} className="mx-auto mt-6 flex max-w-lg items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5 shadow-sm">
            <Search size={18} className="ms-3 shrink-0 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="w-full border-none bg-transparent px-1 py-1.5 text-sm outline-none"
            />
            <button type="submit" className="shrink-0 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {t("common:actions.search")}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">{t("home.categoriesTitle")}</h2>
        {categories.isLoading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {categories.data?.map((c) => (
              <CategoryPill key={c.id} category={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">{t("home.popularRestaurants")}</h2>
          <Link to="/restaurants" className="text-sm font-medium text-brand-600 hover:underline">
            {t("home.viewAllRestaurants")}
          </Link>
        </div>
        {popular.isLoading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.data?.items.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
