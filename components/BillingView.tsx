"use client";

// 🧾 Billing: make a bill from My Shop products (no tax), see past bills,
// and mark credit (udhaar) bills as paid.

import { useState } from "react";
import BillReceipt from "@/components/BillReceipt";
import {
  PAYMENT_MODES,
  billTotal,
  creditDue,
  isSameDay,
  nextBillNo,
  salesOn,
  subtotal,
  type Bill,
  type BillItem,
  type PaymentMode,
} from "@/lib/billing";
import type { Lang } from "@/lib/crops";
import { dateTime, rupees } from "@/lib/format";
import { isBannedProduct, type Product } from "@/lib/inventory";
import type { Settings } from "@/lib/settings";
import { TEXT, fill } from "@/lib/text";
import { useNow } from "@/lib/useNow";

type Props = {
  lang: Lang;
  settings: Settings;
  products: Product[];
  bills: Bill[];
  cart: BillItem[];
  setCart: (items: BillItem[]) => void;
  onSave: (bill: Bill) => void;
  onUpdate: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
};

type Filter = "today" | "due" | "all";

export function itemFromProduct(p: Pick<Product, "id" | "name" | "unit" | "price">): BillItem {
  return { productId: p.id, name: p.name, unit: p.unit, qty: 1, price: p.price };
}

export default function BillingView({ lang, settings, products, bills, cart, setCart, onSave, onUpdate, onDelete }: Props) {
  const t = TEXT[lang];
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [village, setVillage] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMode>("cash");
  const [filter, setFilter] = useState<Filter>("today");
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const now = useNow();

  // Banned products can't be billed.
  const sellable = products.filter((p) => !isBannedProduct(p));
  const query = search.trim().toLowerCase();
  const matches = query
    ? sellable.filter((p) => `${p.name} ${p.ingredient}`.toLowerCase().includes(query)).slice(0, 8)
    : sellable.filter((p) => p.qty > 0).slice(0, 8);

  const stockOf = (id: string) => products.find((p) => p.id === id)?.qty ?? 0;
  const total = Math.max(0, subtotal(cart) - discount);

  function addItem(p: Product) {
    const existing = cart.find((i) => i.productId === p.id);
    setCart(existing ? cart.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i)) : [...cart, itemFromProduct(p)]);
    setSearch("");
    setMessage(null);
  }

  function updateItem(productId: string, patch: Partial<BillItem>) {
    setCart(cart.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));
  }

  function clearBill() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setVillage("");
    setDiscount(0);
    setPayment("cash");
  }

  function saveBill() {
    if (cart.length === 0) return;
    const bill: Bill = {
      id: `b${Date.now().toString(36)}`,
      no: nextBillNo(bills),
      at: Date.now(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      village: village.trim(),
      items: cart,
      discount: Math.min(discount, subtotal(cart)),
      payment,
      paid: payment !== "credit",
    };
    onSave(bill);
    clearBill();
    setMessage(fill(t.billSaved, { n: bill.no }));
    setOpenId(bill.id);
  }

  const today = salesOn(bills, now);
  const credit = creditDue(bills);
  const shown =
    filter === "today" ? bills.filter((b) => isSameDay(b.at, now)) : filter === "due" ? credit.bills : bills;
  const open = bills.find((b) => b.id === openId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-start">
      {/* New bill */}
      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-lg font-bold text-stone-900">🧾 {t.newBill}</h2>

        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchToAdd}
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addItem(p)}
                className={`rounded-full px-3 py-1.5 text-sm ring-1 ${
                  p.qty > 0 ? "bg-green-50 text-green-900 ring-green-200 hover:bg-green-100" : "bg-stone-50 text-stone-500 ring-stone-200"
                }`}
              >
                + {p.name}
                {p.price > 0 && <span className="ml-1 text-xs opacity-70">{rupees(p.price)}</span>}
              </button>
            ))}
          </div>
        </div>

        {cart.length === 0 ? (
          <p className="rounded-xl bg-stone-50 p-4 text-center text-sm text-stone-500">{t.billEmpty}</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl ring-1 ring-stone-200">
            {cart.map((i) => {
              const stock = stockOf(i.productId);
              return (
                <li key={i.productId} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900">{i.name}</p>
                      <p className="text-xs text-stone-500">{i.unit}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCart(cart.filter((x) => x.productId !== i.productId))}
                      aria-label={t.remove}
                      className="rounded-full px-2 text-lg leading-none text-stone-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-lg ring-1 ring-stone-300">
                      <button type="button" onClick={() => updateItem(i.productId, { qty: Math.max(1, i.qty - 1) })} className="px-3 py-1.5 text-lg">
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateItem(i.productId, { qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                        aria-label={t.qty}
                        className="w-12 border-x border-stone-300 py-1.5 text-center"
                      />
                      <button type="button" onClick={() => updateItem(i.productId, { qty: i.qty + 1 })} className="px-3 py-1.5 text-lg">
                        +
                      </button>
                    </div>
                    <label className="flex items-center gap-1 text-sm text-stone-600">
                      ₹
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={i.price}
                        onChange={(e) => updateItem(i.productId, { price: Math.max(0, Number(e.target.value) || 0) })}
                        aria-label={t.price}
                        className="w-24 rounded-lg border border-stone-300 px-2 py-1.5"
                      />
                    </label>
                    <span className="ml-auto font-semibold text-stone-900">{rupees(i.qty * i.price)}</span>
                  </div>
                  {i.qty > stock && <p className="mt-1 text-xs font-medium text-amber-700">⚠ {fill(t.onlyInStock, { n: stock })}</p>}
                  {i.price === 0 && <p className="mt-1 text-xs text-stone-500">{t.noPrice}</p>}
                </li>
              );
            })}
          </ul>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t.customer} className="rounded-lg border border-stone-300 px-3 py-2" />
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder={t.customerPhone} inputMode="tel" className="rounded-lg border border-stone-300 px-3 py-2" />
          <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder={t.village} className="rounded-lg border border-stone-300 px-3 py-2" />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-600">{t.payment}</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPayment(m)}
                aria-pressed={payment === m}
                className={`rounded-xl px-2 py-2.5 text-sm font-semibold ${
                  payment === m ? (m === "credit" ? "bg-amber-500 text-white" : "bg-green-700 text-white") : "bg-stone-100 text-stone-700"
                }`}
              >
                {t.payModes[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 rounded-xl bg-stone-50 p-3">
          <div className="flex justify-between text-sm text-stone-600">
            <span>{t.subtotal}</span>
            <span>{rupees(subtotal(cart))}</span>
          </div>
          <label className="flex items-center justify-between text-sm text-stone-600">
            <span>{t.discount}</span>
            <input
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              className="w-24 rounded-lg border border-stone-300 bg-white px-2 py-1 text-right"
            />
          </label>
          <div className="flex justify-between pt-1 text-xl font-bold text-stone-900">
            <span>{t.total}</span>
            <span>{rupees(total)}</span>
          </div>
        </div>

        {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800">{message}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveBill}
            disabled={cart.length === 0}
            className="flex-1 rounded-xl bg-green-700 px-4 py-3.5 text-lg font-bold text-white hover:bg-green-800 disabled:opacity-50"
          >
            ✓ {t.saveBill}
          </button>
          {cart.length > 0 && (
            <button type="button" onClick={clearBill} className="rounded-xl px-4 py-3.5 text-stone-700 ring-1 ring-stone-300">
              {t.clearBill}
            </button>
          )}
        </div>
      </section>

      {/* Past bills */}
      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-green-700 p-4 text-white shadow-sm">
            <p className="text-xs font-medium text-green-100">{t.todaySales}</p>
            <p className="text-2xl font-bold">{rupees(today.total)}</p>
            <p className="text-xs text-green-100">{fill(t.billsCount, { n: today.count })}</p>
          </div>
          <div className="rounded-2xl bg-amber-500 p-4 text-white shadow-sm">
            <p className="text-xs font-medium text-amber-50">{t.creditDue}</p>
            <p className="text-2xl font-bold">{rupees(credit.total)}</p>
            <p className="text-xs text-amber-50">{fill(t.creditCount, { n: credit.count })}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-stone-900">{t.billsTitle}</h2>
            <div className="flex rounded-full bg-stone-100 p-0.5 text-xs font-semibold">
              {(["today", "due", "all"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-2.5 py-1 ${filter === f ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
                >
                  {f === "today" ? t.today : f === "due" ? t.dueOnly : t.allBills}
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">{t.noBills}</p>
          ) : (
            <ul className="mt-2 divide-y divide-stone-100">
              {shown.map((b) => {
                const isDue = b.payment === "credit" && !b.paid;
                return (
                  <li key={b.id}>
                    <button type="button" onClick={() => setOpenId(b.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-stone-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-stone-900">
                          {fill(t.billNo, { n: b.no })} · {b.customerName || t.walkIn}
                        </span>
                        <span className="block text-xs text-stone-500">
                          {dateTime(b.at, lang)} · {fill(t.itemsCount, { n: b.items.length })} · {t.payModes[b.payment]}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold text-stone-900">{rupees(billTotal(b))}</span>
                        {isDue && <span className="text-xs font-semibold text-red-700">{t.due}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {open && (
        <BillReceipt
          bill={open}
          lang={lang}
          settings={settings}
          onClose={() => setOpenId(null)}
          onMarkPaid={() => onUpdate({ ...open, paid: true })}
          onDelete={() => {
            onDelete(open);
            setOpenId(null);
          }}
        />
      )}
    </div>
  );
}
