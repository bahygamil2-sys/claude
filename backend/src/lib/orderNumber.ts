import crypto from "node:crypto";

export function generateOrderNumber(date: Date = new Date()): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${dateStr}-${suffix}`;
}
