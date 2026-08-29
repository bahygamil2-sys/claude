import { OrderStatus } from "@prisma/client";
import { ApiError } from "../../lib/ApiError";

/** Forward-only transitions used by PATCH /orders/:id/status (owner/admin advancing fulfillment). */
export const FORWARD_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const OWNER_CANCELLABLE_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING];
export const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

export function assertForwardTransition(current: OrderStatus, next: OrderStatus) {
  if (!FORWARD_TRANSITIONS[current]?.includes(next)) {
    throw ApiError.conflict(`Cannot move order from ${current} to ${next}`, { current, requested: next });
  }
}

export function assertCancellable(current: OrderStatus, allowedFrom: OrderStatus[]) {
  if (!allowedFrom.includes(current)) {
    throw ApiError.conflict(`Order can no longer be cancelled (current status: ${current})`, { current });
  }
}
