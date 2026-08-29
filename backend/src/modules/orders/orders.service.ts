import { OrderStatus, PaymentStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { generateOrderNumber } from "../../lib/orderNumber";
import { emitAdminActivity, emitOrderNew, emitOrderStatusChanged } from "../../sockets/emitters";
import { startSimulation } from "../tracking/trackingSimulator";
import {
  assertCancellable,
  assertForwardTransition,
  CUSTOMER_CANCELLABLE_STATUSES,
  OWNER_CANCELLABLE_STATUSES,
} from "./orderStateMachine";
import type { AdminOrdersQuery, CreateOrderInput, CreateReviewInput, ListMyOrdersQuery, RestaurantOrdersQuery } from "./orders.schema";

type AuthUser = { id: string; role: Role };

const ORDER_DETAIL_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { changedAt: "asc" as const } },
  restaurant: true,
  customer: { select: { id: true, name: true, phone: true } },
  payment: true,
  review: true,
} satisfies Prisma.OrderInclude;

async function fetchAuthorizedOrder(orderId: string, user: AuthUser) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_DETAIL_INCLUDE });
  if (!order) throw ApiError.notFound("Order not found");

  const canView = user.role === Role.ADMIN || order.customerId === user.id || order.restaurant.ownerId === user.id;
  if (!canView) throw ApiError.forbidden();

  return order;
}

export async function create(customerId: string, input: CreateOrderInput) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: input.restaurantId } });
  if (!restaurant) throw ApiError.notFound("Restaurant not found");
  if (restaurant.status !== "APPROVED") throw ApiError.conflict("This restaurant is not currently accepting orders");
  if (!restaurant.isOpen) throw ApiError.conflict("This restaurant is closed right now");

  const address = await prisma.address.findUnique({ where: { id: input.addressId } });
  if (!address || address.userId !== customerId) throw ApiError.notFound("Delivery address not found");

  const menuItemIds = [...new Set(input.items.map((line) => line.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, restaurantId: restaurant.id },
    include: { optionGroups: { include: { options: true } } },
  });
  const menuItemById = new Map(menuItems.map((item) => [item.id, item]));

  let subtotal = 0;
  const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

  for (const line of input.items) {
    const item = menuItemById.get(line.menuItemId);
    if (!item) throw ApiError.badRequest("One or more items are invalid for this restaurant");
    if (!item.isAvailable) throw ApiError.conflict(`"${item.name}" is currently unavailable`);

    let unitPrice = Number(item.price);
    const selectedSnapshot: { groupName: string; groupNameAr: string; optionName: string; optionNameAr: string; priceDelta: number }[] = [];
    const claimedOptionIds = new Set<string>();

    for (const group of item.optionGroups) {
      const matches = group.options.filter((opt) => line.selectedOptionIds.includes(opt.id));
      matches.forEach((opt) => claimedOptionIds.add(opt.id));

      if (group.isRequired && matches.length === 0) {
        throw ApiError.badRequest(`Please choose an option for "${group.name}" on "${item.name}"`);
      }
      if (matches.length < group.minSelect || matches.length > group.maxSelect) {
        throw ApiError.badRequest(`Invalid number of selections for "${group.name}" on "${item.name}"`);
      }
      for (const opt of matches) {
        unitPrice += Number(opt.priceDelta);
        selectedSnapshot.push({
          groupName: group.name,
          groupNameAr: group.nameAr,
          optionName: opt.name,
          optionNameAr: opt.nameAr,
          priceDelta: Number(opt.priceDelta),
        });
      }
    }

    const unrecognized = line.selectedOptionIds.filter((id) => !claimedOptionIds.has(id));
    if (unrecognized.length > 0) {
      throw ApiError.badRequest(`One or more selected options are invalid for "${item.name}"`);
    }

    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;
    orderItemsData.push({
      menuItemId: item.id,
      nameSnapshot: item.name,
      nameArSnapshot: item.nameAr,
      priceSnapshot: unitPrice,
      quantity: line.quantity,
      lineTotal,
      selectedOptionsSnapshot: selectedSnapshot.length ? selectedSnapshot : undefined,
    });
  }

  if (subtotal < Number(restaurant.minOrderAmount)) {
    throw ApiError.badRequest(`Order subtotal must be at least ${restaurant.minOrderAmount}`);
  }

  const deliveryFee = Number(restaurant.deliveryFee);
  const total = subtotal + deliveryFee;
  const paymentStatus = input.paymentMethod === "CARD_MOCK" ? PaymentStatus.PAID : PaymentStatus.PENDING;

  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      const created = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId,
            restaurantId: restaurant.id,
            addressId: address.id,
            deliveryAddressLine: [address.building, address.street].filter(Boolean).join(", "),
            deliveryCity: address.city,
            deliveryLat: address.lat,
            deliveryLng: address.lng,
            subtotal,
            deliveryFee,
            total,
            paymentMethod: input.paymentMethod,
            paymentStatus,
            notes: input.notes,
            items: { createMany: { data: orderItemsData } },
          },
        });

        await tx.orderStatusHistory.create({
          data: { orderId: order.id, status: OrderStatus.PENDING, changedByUserId: customerId },
        });

        await tx.payment.create({
          data: {
            orderId: order.id,
            method: input.paymentMethod,
            status: paymentStatus,
            amount: total,
            transactionRef: `MOCK-${order.id.slice(0, 8)}`,
          },
        });

        // Re-fetch so the returned order's statusHistory/payment reflect the rows just created above.
        return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: ORDER_DETAIL_INCLUDE });
      });

      emitOrderNew({
        id: created.id,
        orderNumber: created.orderNumber,
        restaurantId: created.restaurantId,
        status: created.status,
        total: Number(created.total),
        createdAt: created.createdAt,
      });
      emitAdminActivity({
        type: "order_created",
        message: `${created.customer.name} placed order ${created.orderNumber} at ${created.restaurant.name}`,
        at: created.createdAt,
        meta: { orderId: created.id },
      });
      return created;
    } catch (err) {
      const isDuplicateOrderNumber = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (isDuplicateOrderNumber && attempt < MAX_ATTEMPTS) continue;
      throw err;
    }
  }
  throw new Error("Failed to create order after multiple attempts");
}

export async function listMine(customerId: string, query: ListMyOrdersQuery) {
  const where: Prisma.OrderWhereInput = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.dateFrom || query.dateTo ? { createdAt: { gte: query.dateFrom, lte: query.dateTo } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { items: true, restaurant: { select: { name: true, nameAr: true, logoUrl: true, slug: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}

export async function getById(orderId: string, user: AuthUser) {
  return fetchAuthorizedOrder(orderId, user);
}

export async function getTracking(orderId: string, user: AuthUser) {
  const order = await fetchAuthorizedOrder(orderId, user);
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    driver:
      order.driverId && order.driverLat != null && order.driverLng != null
        ? { lat: order.driverLat, lng: order.driverLng, heading: order.driverHeading, updatedAt: order.driverUpdatedAt }
        : null,
    restaurant: {
      name: order.restaurant.name,
      nameAr: order.restaurant.nameAr,
      lat: order.restaurant.lat,
      lng: order.restaurant.lng,
    },
    destination: { lat: order.deliveryLat, lng: order.deliveryLng, addressLine: order.deliveryAddressLine },
    statusHistory: order.statusHistory,
  };
}

export async function updateStatus(orderId: string, user: AuthUser, newStatus: OrderStatus) {
  if (user.role === Role.CUSTOMER) throw ApiError.forbidden();
  const order = await fetchAuthorizedOrder(orderId, user);
  assertForwardTransition(order.status, newStatus);

  let updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        ...(newStatus === OrderStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
      },
    });
    await tx.orderStatusHistory.create({ data: { orderId, status: newStatus, changedByUserId: user.id } });
    if (newStatus === OrderStatus.DELIVERED && result.paymentMethod === "CASH") {
      await tx.payment.updateMany({ where: { orderId }, data: { status: PaymentStatus.PAID } });
    }
    // Re-fetch so the returned order's statusHistory/payment reflect the rows just touched above.
    return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_DETAIL_INCLUDE });
  });

  emitOrderStatusChanged({ orderId, restaurantId: updated.restaurantId, status: newStatus, changedAt: new Date() });
  emitAdminActivity({
    type: "order_status_changed",
    message: `Order ${updated.orderNumber} at ${updated.restaurant.name} is now ${newStatus}`,
    at: new Date(),
    meta: { orderId, status: newStatus },
  });

  if (newStatus === OrderStatus.OUT_FOR_DELIVERY) {
    updated = await assignDriverAndStartTracking(updated);
  }

  return updated;
}

/** Driver assignment + live tracking kickoff when an order moves to OUT_FOR_DELIVERY. */
async function assignDriverAndStartTracking(order: Awaited<ReturnType<typeof fetchAuthorizedOrder>>) {
  const availableDrivers = await prisma.driver.findMany({ where: { isActive: true } });
  const driver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
  const restaurantPos = { lat: Number(order.restaurant.lat), lng: Number(order.restaurant.lng) };
  const destinationPos = { lat: order.deliveryLat, lng: order.deliveryLng };

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: driver
      ? { driverId: driver.id, driverLat: restaurantPos.lat, driverLng: restaurantPos.lng, driverUpdatedAt: new Date() }
      : {},
    include: ORDER_DETAIL_INCLUDE,
  });

  if (driver) {
    startSimulation({
      orderId: order.id,
      start: restaurantPos,
      end: destinationPos,
      onComplete: () => completeDeliveryFromSimulation(order.id),
    });
  }

  return updated;
}

/** Called by the tracking simulator when a driver "arrives" — mirrors updateStatus's DELIVERED path,
 *  but skips role/transition checks since this is a system-initiated transition, not a user action. */
async function completeDeliveryFromSimulation(orderId: string) {
  const current = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, restaurantId: true, paymentMethod: true, orderNumber: true, restaurant: { select: { name: true } } },
  });
  if (!current || current.status !== OrderStatus.OUT_FOR_DELIVERY) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() } });
    await tx.orderStatusHistory.create({ data: { orderId, status: OrderStatus.DELIVERED, changedByUserId: null } });
    if (current.paymentMethod === "CASH") {
      await tx.payment.updateMany({ where: { orderId }, data: { status: PaymentStatus.PAID } });
    }
  });

  emitOrderStatusChanged({ orderId, restaurantId: current.restaurantId, status: OrderStatus.DELIVERED, changedAt: new Date() });
  emitAdminActivity({
    type: "order_status_changed",
    message: `Order ${current.orderNumber} at ${current.restaurant.name} was delivered`,
    at: new Date(),
    meta: { orderId, status: OrderStatus.DELIVERED },
  });
}

export async function cancel(orderId: string, user: AuthUser, reason: string | undefined) {
  const order = await fetchAuthorizedOrder(orderId, user);
  const isCustomer = user.role === Role.CUSTOMER;

  if (isCustomer && order.customerId !== user.id) throw ApiError.forbidden();
  assertCancellable(order.status, isCustomer ? CUSTOMER_CANCELLABLE_STATUSES : OWNER_CANCELLABLE_STATUSES);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date(), cancelReason: reason },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, status: OrderStatus.CANCELLED, changedByUserId: user.id, note: reason },
    });
    await tx.payment.updateMany({ where: { orderId }, data: { status: PaymentStatus.FAILED } });
    // Re-fetch so the returned order's statusHistory/payment reflect the rows just touched above.
    return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_DETAIL_INCLUDE });
  });

  emitOrderStatusChanged({ orderId, restaurantId: updated.restaurantId, status: OrderStatus.CANCELLED, changedAt: new Date() });
  emitAdminActivity({
    type: "order_status_changed",
    message: `Order ${updated.orderNumber} at ${updated.restaurant.name} was cancelled`,
    at: new Date(),
    meta: { orderId, status: OrderStatus.CANCELLED },
  });

  return updated;
}

export async function restaurantOrders(restaurantId: string, user: AuthUser, query: RestaurantOrdersQuery) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw ApiError.notFound("Restaurant not found");
  if (user.role !== Role.ADMIN && restaurant.ownerId !== user.id) throw ApiError.forbidden();

  const where: Prisma.OrderWhereInput = {
    restaurantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.dateFrom || query.dateTo ? { createdAt: { gte: query.dateFrom, lte: query.dateTo } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { items: true, customer: { select: { name: true, phone: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}

export async function adminOrders(query: AdminOrdersQuery) {
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.restaurantId ? { restaurantId: query.restaurantId } : {}),
    ...(query.city ? { restaurant: { city: { equals: query.city, mode: "insensitive" } } } : {}),
    ...(query.dateFrom || query.dateTo ? { createdAt: { gte: query.dateFrom, lte: query.dateTo } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        items: true,
        customer: { select: { name: true } },
        restaurant: { select: { name: true, nameAr: true, city: true, slug: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}

export async function createReview(orderId: string, customerId: string, input: CreateReviewInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { review: true } });
  if (!order || order.customerId !== customerId) throw ApiError.notFound("Order not found");
  if (order.status !== OrderStatus.DELIVERED) throw ApiError.conflict("You can only review delivered orders");
  if (order.review) throw ApiError.conflict("You have already reviewed this order");

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: { orderId, customerId, restaurantId: order.restaurantId, rating: input.rating, comment: input.comment },
    });

    const agg = await tx.review.aggregate({ where: { restaurantId: order.restaurantId }, _avg: { rating: true }, _count: true });
    await tx.restaurant.update({
      where: { id: order.restaurantId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });

    return review;
  });
}
