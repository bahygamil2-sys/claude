import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { MapPinOff } from "lucide-react";
import { useOrderTracking } from "@/features/orders/ordersApi";
import { useOrderRoom } from "@/hooks/useOrderRoom";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { FullPageSpinner } from "@/components/Spinner";
import { OrderStatusBadge } from "@/components/Badge";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { TrackingMap } from "./TrackingMap";
import type { OrderStatus } from "@/types/api";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const TIMELINE_ORDER: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"];

interface DriverTickPayload {
  orderId: string;
  lat: number;
  lng: number;
  heading: number | null;
  etaMinutes: number | null;
}
interface StatusChangedPayload {
  orderId: string;
  status: OrderStatus;
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("customer");
  const queryClient = useQueryClient();

  const trackingQuery = useOrderTracking(id);
  useOrderRoom(id);

  const [liveDriver, setLiveDriver] = useState<DriverTickPayload | null>(null);

  useSocketEvent<DriverTickPayload>(
    "order:driverLocation",
    (payload) => {
      if (payload.orderId === id) setLiveDriver(payload);
    },
    [id]
  );

  useSocketEvent<StatusChangedPayload>(
    "order:statusChanged",
    (payload) => {
      if (payload.orderId !== id) return;
      void queryClient.invalidateQueries({ queryKey: ["order-tracking", id] });
      void queryClient.invalidateQueries({ queryKey: ["order", id] });
      if (payload.status === "DELIVERED") setLiveDriver(null);
    },
    [id, queryClient]
  );

  if (trackingQuery.isLoading) return <FullPageSpinner />;
  if (!trackingQuery.data) return <PlaceholderPage title={t("orderDetail.notFound")} />;

  const tracking = trackingQuery.data;
  const restaurantPos = { lat: tracking.restaurant.lat, lng: tracking.restaurant.lng };
  const destinationPos = { lat: tracking.destination.lat, lng: tracking.destination.lng };
  const driverPos = liveDriver ?? tracking.driver;
  const etaMinutes = liveDriver?.etaMinutes ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">{t("tracking.title")}</h1>
          <p className="text-sm text-neutral-500">{tracking.orderNumber}</p>
        </div>
        <OrderStatusBadge status={tracking.status} label={t(`common:orderStatus.${tracking.status}`)} />
      </div>

      <div className="h-72 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 sm:h-96">
        {GOOGLE_MAPS_KEY ? (
          <TrackingMap apiKey={GOOGLE_MAPS_KEY} restaurantPos={restaurantPos} destinationPos={destinationPos} driverPos={driverPos} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <MapPinOff size={28} className="text-neutral-400" />
            <p className="text-sm font-medium text-neutral-600">{t("tracking.mapUnavailable")}</p>
            <p className="max-w-sm text-xs text-neutral-400">{t("tracking.mapUnavailableHint")}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
        <LegendItem color="#2563eb" label={t("tracking.legendRestaurant")} />
        <LegendItem color="#ea580c" label={t("tracking.legendDestination")} />
        <LegendItem color="#16a34a" label={t("tracking.legendDriver")} />
      </div>

      {etaMinutes != null && <p className="text-center text-sm font-medium text-brand-700">{t("tracking.eta", { minutes: etaMinutes })}</p>}
      {!driverPos && tracking.status === "OUT_FOR_DELIVERY" && <p className="text-center text-sm text-neutral-500">{t("tracking.waitingForDriver")}</p>}

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">{t("orderDetail.statusTimeline")}</h2>
        <ol className="flex flex-col gap-3">
          {TIMELINE_ORDER.map((status) => {
            const entry = tracking.statusHistory.find((h) => h.status === status);
            return (
              <li key={status} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${entry ? "bg-brand-600" : "bg-neutral-200"}`} />
                <span className={`flex-1 text-sm ${entry ? "font-medium text-neutral-800" : "text-neutral-400"}`}>{t(`common:orderStatus.${status}`)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <Link to={`/orders/${id}`} className="text-center text-sm text-neutral-500 hover:underline">
        ← {t("orderDetail.backToOrders")}
      </Link>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
