import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useMyRestaurants } from "./restaurantOwnerApi";
import { FullPageSpinner } from "@/components/Spinner";
import { CreateRestaurantForm } from "./CreateRestaurantForm";
import type { Restaurant } from "@/types/api";

interface Ctx {
  restaurants: Restaurant[];
  selected: Restaurant;
  setSelectedId: (id: string) => void;
}

const RestaurantDashboardContext = createContext<Ctx | null>(null);

export function RestaurantDashboardProvider({ children }: { children: ReactNode }) {
  const { data: restaurants, isLoading } = useMyRestaurants();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedId && restaurants && restaurants.length > 0) setSelectedId(restaurants[0].id);
  }, [selectedId, restaurants]);

  if (isLoading) return <FullPageSpinner />;
  if (!restaurants || restaurants.length === 0) return <CreateRestaurantForm />;

  const selected = restaurants.find((r) => r.id === selectedId) ?? restaurants[0];

  return <RestaurantDashboardContext.Provider value={{ restaurants, selected, setSelectedId }}>{children}</RestaurantDashboardContext.Provider>;
}

export function useRestaurantDashboard() {
  const ctx = useContext(RestaurantDashboardContext);
  if (!ctx) throw new Error("useRestaurantDashboard must be used within RestaurantDashboardProvider");
  return ctx;
}
