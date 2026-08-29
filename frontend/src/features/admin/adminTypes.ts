import type { OrderStatus, PaymentMethod, PaymentStatus, Restaurant } from "@/types/api";

export interface AdminRestaurantListItem extends Restaurant {
  owner: { name: string; email: string; phone: string | null };
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: string;
  deliveryFee: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  items: { id: string }[];
  customer: { name: string };
  restaurant: { name: string; nameAr: string; city: string; slug: string };
}
