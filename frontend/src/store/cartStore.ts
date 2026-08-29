import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLineOption {
  groupName: string;
  groupNameAr: string;
  optionId: string;
  optionName: string;
  optionNameAr: string;
  priceDelta: number;
}

export interface CartLine {
  lineId: string;
  lineKey: string;
  menuItemId: string;
  name: string;
  nameAr: string;
  imageUrl: string | null;
  basePrice: number;
  selectedOptions: CartLineOption[];
  quantity: number;
}

type AddItemParams = {
  restaurantId: string;
  restaurantName: string;
  restaurantNameAr: string;
  restaurantSlug: string;
  menuItemId: string;
  name: string;
  nameAr: string;
  imageUrl: string | null;
  basePrice: number;
  selectedOptions: CartLineOption[];
  quantity?: number;
};

type CartState = {
  restaurantId: string | null;
  restaurantName: string | null;
  restaurantNameAr: string | null;
  restaurantSlug: string | null;
  lines: CartLine[];
  addItem: (params: AddItemParams) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
};

function lineKeyFor(menuItemId: string, options: CartLineOption[]): string {
  const optionIds = options
    .map((o) => o.optionId)
    .sort()
    .join(",");
  return `${menuItemId}::${optionIds}`;
}

function lineUnitPrice(line: Pick<CartLine, "basePrice" | "selectedOptions">): number {
  return line.basePrice + line.selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
}

export function cartLineTotal(line: CartLine): number {
  return lineUnitPrice(line) * line.quantity;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + cartLineTotal(line), 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      restaurantId: null,
      restaurantName: null,
      restaurantNameAr: null,
      restaurantSlug: null,
      lines: [],

      addItem: (params) =>
        set((state) => {
          const isNewRestaurant = state.restaurantId !== null && state.restaurantId !== params.restaurantId;
          const baseLines = isNewRestaurant ? [] : state.lines;
          const lineKey = lineKeyFor(params.menuItemId, params.selectedOptions);
          const existing = baseLines.find((l) => l.lineKey === lineKey);
          const quantity = params.quantity ?? 1;

          const lines = existing
            ? baseLines.map((l) => (l.lineId === existing.lineId ? { ...l, quantity: l.quantity + quantity } : l))
            : [
                ...baseLines,
                {
                  lineId: crypto.randomUUID(),
                  lineKey,
                  menuItemId: params.menuItemId,
                  name: params.name,
                  nameAr: params.nameAr,
                  imageUrl: params.imageUrl,
                  basePrice: params.basePrice,
                  selectedOptions: params.selectedOptions,
                  quantity,
                },
              ];

          return {
            restaurantId: params.restaurantId,
            restaurantName: params.restaurantName,
            restaurantNameAr: params.restaurantNameAr,
            restaurantSlug: params.restaurantSlug,
            lines,
          };
        }),

      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0 ? state.lines.filter((l) => l.lineId !== lineId) : state.lines.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
        })),

      removeLine: (lineId) => set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),

      clear: () => set({ restaurantId: null, restaurantName: null, restaurantNameAr: null, restaurantSlug: null, lines: [] }),
    }),
    { name: "sufra-cart" }
  )
);
