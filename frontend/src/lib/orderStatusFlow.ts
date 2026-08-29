import type { OrderStatus } from "@/types/api";

/** Mirrors backend/src/modules/orders/orderStateMachine.ts's FORWARD_TRANSITIONS (owner/admin advancing fulfillment). */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};
