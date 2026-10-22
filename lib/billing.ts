// Bills (no tax): products from My Shop, quantity × price, optional discount.
// Saving a bill lowers the stock in My Shop. Credit (udhaar) bills can be
// marked as paid later. Saved on this device only.

import { z } from "zod";
import type { Product } from "./inventory";

export const PAYMENT_MODES = ["cash", "upi", "credit"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const BillItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  unit: z.string().default(""),
  qty: z.number().int().min(1),
  price: z.number().min(0), // ₹ per unit at the time of sale
});
export type BillItem = z.infer<typeof BillItemSchema>;

export const BillSchema = z.object({
  id: z.string(),
  no: z.number().int().min(1),
  at: z.number(), // time of the bill
  customerName: z.string().default(""),
  customerPhone: z.string().default(""),
  village: z.string().default(""),
  items: z.array(BillItemSchema).min(1),
  discount: z.number().min(0).default(0),
  payment: z.enum(PAYMENT_MODES).default("cash"),
  paid: z.boolean().default(true), // false = credit still due
});
export type Bill = z.infer<typeof BillSchema>;

export const MAX_BILLS = 2000;

export function parseBills(value: unknown): Bill[] | null {
  const r = z.array(BillSchema).safeParse(value);
  return r.success ? r.data : null;
}

export function subtotal(items: BillItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

export function billTotal(bill: Pick<Bill, "items" | "discount">): number {
  return Math.max(0, subtotal(bill.items) - bill.discount);
}

export function nextBillNo(bills: Bill[]): number {
  return bills.reduce((max, b) => Math.max(max, b.no), 0) + 1;
}

// Lowers stock for a new bill, or raises it back when a bill is deleted (sign = +1).
export function applyStock(products: Product[], items: BillItem[], sign: -1 | 1): Product[] {
  return products.map((p) => {
    const sold = items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.qty, 0);
    return sold ? { ...p, qty: Math.max(0, p.qty + sign * sold) } : p;
  });
}

export function isSameDay(a: number, b: number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

export function salesOn(bills: Bill[], day: number) {
  const todays = bills.filter((b) => isSameDay(b.at, day));
  return {
    count: todays.length,
    total: todays.reduce((sum, b) => sum + billTotal(b), 0),
    cash: todays.filter((b) => b.payment !== "credit").reduce((sum, b) => sum + billTotal(b), 0),
  };
}

export function creditDue(bills: Bill[]) {
  const due = bills.filter((b) => b.payment === "credit" && !b.paid);
  return { count: due.length, total: due.reduce((sum, b) => sum + billTotal(b), 0), bills: due };
}
