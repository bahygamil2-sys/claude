import type { OrderStatus } from "@prisma/client";
import { getIO } from "../lib/socket";
import { ADMIN_OPS_ROOM, orderRoom, restaurantRoom } from "./index";

/** Real-time notification is a side effect, not core to request correctness — never let it throw. */
function safeEmit(fn: () => void) {
  try {
    fn();
  } catch (err) {
    console.error("Socket emit failed:", err);
  }
}

export function emitOrderNew(order: {
  id: string;
  orderNumber: string;
  restaurantId: string;
  status: OrderStatus;
  total: number | string;
  createdAt: Date;
}) {
  safeEmit(() => {
    const io = getIO();
    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
    };
    io.to(restaurantRoom(order.restaurantId)).emit("order:new", payload);
    io.to(ADMIN_OPS_ROOM).emit("order:new", payload);
  });
}

export function emitOrderStatusChanged(params: { orderId: string; restaurantId: string; status: OrderStatus; changedAt: Date }) {
  safeEmit(() => {
    const io = getIO();
    const payload = { orderId: params.orderId, status: params.status, changedAt: params.changedAt };
    io.to(orderRoom(params.orderId)).emit("order:statusChanged", payload);
    io.to(restaurantRoom(params.restaurantId)).emit("order:statusChanged", payload);
    io.to(ADMIN_OPS_ROOM).emit("order:statusChanged", payload);
  });
}

export function emitDriverLocation(params: {
  orderId: string;
  lat: number;
  lng: number;
  heading: number | null;
  etaMinutes: number | null;
}) {
  safeEmit(() => {
    getIO().to(orderRoom(params.orderId)).emit("order:driverLocation", params);
  });
}

export function emitAdminActivity(params: { type: string; message: string; at: Date; meta?: unknown }) {
  safeEmit(() => {
    getIO().to(ADMIN_OPS_ROOM).emit("admin:activity", params);
  });
}
