import { Link } from "react-router-dom";
import { useLocalized } from "@/hooks/useLocalized";
import type { Category } from "@/types/api";

export function CategoryPill({ category, active }: { category: Category; active?: boolean }) {
  const pick = useLocalized();
  return (
    <Link
      to={`/restaurants?categoryId=${category.id}`}
      className={`flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center transition-colors ${
        active ? "border-brand-500 bg-brand-50" : "border-neutral-200 bg-white hover:border-brand-300"
      }`}
    >
      <span className="text-2xl">{category.icon ?? "🍽️"}</span>
      <span className="text-xs font-medium text-neutral-700">{pick(category.name, category.nameAr)}</span>
    </Link>
  );
}
