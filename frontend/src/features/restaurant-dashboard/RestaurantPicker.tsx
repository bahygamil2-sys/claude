import { useLocalized } from "@/hooks/useLocalized";
import { useRestaurantDashboard } from "./RestaurantDashboardContext";

export function RestaurantPicker() {
  const { restaurants, selected, setSelectedId } = useRestaurantDashboard();
  const pick = useLocalized();

  if (restaurants.length <= 1) return null;

  return (
    <select
      value={selected.id}
      onChange={(e) => setSelectedId(e.target.value)}
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
    >
      {restaurants.map((r) => (
        <option key={r.id} value={r.id}>
          {pick(r.name, r.nameAr)}
        </option>
      ))}
    </select>
  );
}
