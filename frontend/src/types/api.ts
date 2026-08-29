// Hand-mirrored subset of backend/prisma/schema.prisma + API response shapes.
// Prisma Decimal fields (money) serialize to JSON as strings, not numbers — kept as
// `string` here and converted with `toNumber()` (see lib/money.ts) at the point of use.

export type Role = "CUSTOMER" | "RESTAURANT_OWNER" | "ADMIN";
export type RestaurantStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD_MOCK";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type VehicleType = "MOTORCYCLE" | "CAR" | "BICYCLE";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  city: string;
  area: string | null;
  street: string;
  building: string | null;
  notes: string | null;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  imageUrl: string | null;
  icon: string | null;
  sortOrder: number;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string | null;
  descriptionAr: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  city: string;
  area: string | null;
  addressLine: string;
  lat: number;
  lng: number;
  phone: string;
  status: RestaurantStatus;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  deliveryFee: string;
  minOrderAmount: string;
  avgPreparationTimeMinutes: number;
  ratingAvg: string;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
}

export interface MenuItemOption {
  id: string;
  optionGroupId: string;
  name: string;
  nameAr: string;
  priceDelta: string;
  sortOrder: number;
}

export interface MenuItemOptionGroup {
  id: string;
  menuItemId: string;
  name: string;
  nameAr: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  menuCategoryId: string | null;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isVegetarian: boolean;
  sortOrder: number;
  optionGroups: MenuItemOptionGroup[];
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  nameAr: string;
  sortOrder: number;
  menuItems: MenuItem[];
}

export interface RestaurantMenu {
  menuCategories: MenuCategory[];
  uncategorized: MenuItem[];
}

export interface SelectedOptionSnapshot {
  groupName: string;
  groupNameAr: string;
  optionName: string;
  optionNameAr: string;
  priceDelta: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  nameSnapshot: string;
  nameArSnapshot: string;
  priceSnapshot: string;
  quantity: number;
  selectedOptionsSnapshot: SelectedOptionSnapshot[] | null;
  lineTotal: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedAt: string;
  changedByUserId: string | null;
  note: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  cardLast4: string | null;
  transactionRef: string;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer?: { name: string };
}

export interface OrderCustomerInfo {
  id: string;
  name: string;
  phone: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  addressId: string | null;
  deliveryAddressLine: string;
  deliveryCity: string;
  deliveryLat: number;
  deliveryLng: number;
  status: OrderStatus;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  driverId: string | null;
  driverLat: number | null;
  driverLng: number | null;
  driverHeading: number | null;
  driverUpdatedAt: string | null;
  cancelReason: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  restaurant: Restaurant;
  customer?: OrderCustomerInfo;
  payment: Payment | null;
  review: Review | null;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  driver: { lat: number; lng: number; heading: number | null; updatedAt: string } | null;
  restaurant: { name: string; nameAr: string; lat: number; lng: number };
  destination: { lat: number; lng: number; addressLine: string };
  statusHistory: OrderStatusHistoryEntry[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
