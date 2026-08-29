import type { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { setIO } from "../lib/socket";
import { verifyAccessToken } from "../lib/tokens";
import { prisma } from "../lib/prisma";

type SocketUser = { id: string; role: Role };
type SocketData = { user: SocketUser };
type AppSocket = Socket<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, SocketData>;

export function orderRoom(orderId: string) {
  return `order:${orderId}`;
}
export function restaurantRoom(restaurantId: string) {
  return `restaurant:${restaurantId}`;
}
export const ADMIN_OPS_ROOM = "admin:ops";

async function canAccessOrder(orderId: string, user: SocketUser): Promise<boolean> {
  if (user.role === Role.ADMIN) return true;
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { customerId: true, restaurant: { select: { ownerId: true } } } });
  if (!order) return false;
  return order.customerId === user.id || order.restaurant.ownerId === user.id;
}

async function canAccessRestaurant(restaurantId: string, user: SocketUser): Promise<boolean> {
  if (user.role === Role.ADMIN) return true;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { ownerId: true } });
  return restaurant?.ownerId === user.id;
}

export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, SocketData>(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.use((socket: AppSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error("Invalid or expired auth token"));
    }
  });

  io.on("connection", (socket: AppSocket) => {
    socket.on("join:order", async ({ orderId }: { orderId?: string }) => {
      if (!orderId) return;
      if (await canAccessOrder(orderId, socket.data.user)) socket.join(orderRoom(orderId));
    });

    socket.on("leave:order", ({ orderId }: { orderId?: string }) => {
      if (orderId) socket.leave(orderRoom(orderId));
    });

    socket.on("join:restaurant", async ({ restaurantId }: { restaurantId?: string }) => {
      if (!restaurantId) return;
      if (await canAccessRestaurant(restaurantId, socket.data.user)) socket.join(restaurantRoom(restaurantId));
    });

    socket.on("leave:restaurant", ({ restaurantId }: { restaurantId?: string }) => {
      if (restaurantId) socket.leave(restaurantRoom(restaurantId));
    });

    socket.on("join:adminOps", () => {
      if (socket.data.user.role === Role.ADMIN) socket.join(ADMIN_OPS_ROOM);
    });

    socket.on("disconnect", () => {});
  });

  setIO(io);
  return io;
}
