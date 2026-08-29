// Validated categorical palette from the dataviz skill's reference instance — fixed
// order (never cycled/reassigned), passes CVD-safety checks in this exact sequence.
export const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"] as const;

export const SEQUENTIAL_BLUE = {
  100: "#cde2fb",
  200: "#9ec5f4",
  300: "#6da7ec",
  400: "#3987e5",
  500: "#256abf",
  600: "#184f95",
} as const;

// Fixed — never themed. Used only for genuine order/entity state, never as a generic series color.
export const STATUS_COLORS: Record<string, string> = {
  PENDING: "#fab219",
  CONFIRMED: "#2a78d6",
  PREPARING: "#2a78d6",
  READY_FOR_PICKUP: "#eda100",
  OUT_FOR_DELIVERY: "#eda100",
  DELIVERED: "#0ca30c",
  CANCELLED: "#d03b3b",
};

export const CHART_INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
};
