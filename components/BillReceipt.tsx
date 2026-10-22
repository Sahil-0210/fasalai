"use client";

// One bill, laid out like a shop receipt. Can be printed or sent on WhatsApp.

import { billTotal, subtotal, type Bill } from "@/lib/billing";
import type { Lang } from "@/lib/crops";
import { dateTime, rupees } from "@/lib/format";
import type { Settings } from "@/lib/settings";
import { whatsAppLink } from "@/lib/slip";
import { TEXT, fill } from "@/lib/text";

type Props = {
  bill: Bill;
  lang: Lang;
  settings: Settings;
  onClose: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
};

export function billText(bill: Bill, lang: Lang, settings: Settings): string {
  const t = TEXT[lang];
  const lines = [
    `🧾 *${settings.shopName || "FasalAI"}*`,
    settings.address,
    settings.phone,
    "",
    `${fill(t.billNo, { n: bill.no })} · ${dateTime(bill.at, lang)}`,
    bill.customerName ? `${bill.customerName}${bill.village ? `, ${bill.village}` : ""}` : "",
    "",
    ...bill.items.map((i) => `• ${i.name}${i.unit ? ` (${i.unit})` : ""} × ${i.qty} = ${rupees(i.qty * i.price)}`),
    "",
    bill.discount ? `${t.discount}: −${rupees(bill.discount)}` : "",
    `*${t.total}: ${rupees(billTotal(bill))}*`,
    `${t.payment}: ${t.payModes[bill.payment]}${bill.payment === "credit" ? ` (${bill.paid ? t.paid : t.due})` : ""}`,
    "",
    `_${settings.billNote || t.billThanks}_`,
  ];
  return lines.filter((l, i, all) => l !== "" || (all[i - 1] !== "" && i > 0)).join("\n").trim();
}

export default function BillReceipt({ bill, lang, settings, onClose, onMarkPaid, onDelete }: Props) {
  const t = TEXT[lang];
  const due = bill.payment === "credit" && !bill.paid;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="print-area">
          <div className="text-center">
            <p className="text-xl font-bold text-stone-900">{settings.shopName || "FasalAI"}</p>
            {settings.address && <p className="text-sm text-stone-600">{settings.address}</p>}
            {settings.phone && <p className="text-sm text-stone-600">📞 {settings.phone}</p>}
          </div>
          <div className="mt-3 flex justify-between border-y border-dashed border-stone-300 py-2 text-sm text-stone-700">
            <span className="font-semibold">{fill(t.billNo, { n: bill.no })}</span>
            <span>{dateTime(bill.at, lang)}</span>
          </div>
          <p className="mt-2 text-sm text-stone-800">
            {bill.customerName || t.walkIn}
            {bill.village && `, ${bill.village}`}
            {bill.customerPhone && ` · ${bill.customerPhone}`}
          </p>

          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-500">
                <th className="py-1 font-medium">{t.productName}</th>
                <th className="py-1 text-right font-medium">{t.qty}</th>
                <th className="py-1 text-right font-medium">₹</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((i, n) => (
                <tr key={n} className="border-b border-stone-100 align-top">
                  <td className="py-1.5 pr-2 text-stone-900">
                    {i.name}
                    <span className="block text-xs text-stone-500">
                      {i.unit && `${i.unit} · `}
                      {rupees(i.price)}
                    </span>
                  </td>
                  <td className="py-1.5 text-right">{i.qty}</td>
                  <td className="py-1.5 text-right">{rupees(i.qty * i.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-2 space-y-0.5 text-sm">
            {bill.discount > 0 && (
              <>
                <div className="flex justify-between text-stone-600">
                  <dt>{t.subtotal}</dt>
                  <dd>{rupees(subtotal(bill.items))}</dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>{t.discount}</dt>
                  <dd>−{rupees(bill.discount)}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between text-lg font-bold text-stone-900">
              <dt>{t.total}</dt>
              <dd>{rupees(billTotal(bill))}</dd>
            </div>
            <div className="flex justify-between text-stone-700">
              <dt>{t.payment}</dt>
              <dd>
                {t.payModes[bill.payment]}
                {bill.payment === "credit" && (
                  <span className={`ml-1 font-semibold ${due ? "text-red-700" : "text-green-700"}`}>
                    ({bill.paid ? t.paid : t.due})
                  </span>
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-center text-xs text-stone-500">{settings.billNote || t.billThanks}</p>
        </div>

        <div className="no-print mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => window.print()} className="rounded-xl bg-stone-800 px-3 py-2.5 font-semibold text-white">
            {t.printBill}
          </button>
          <a
            href={whatsAppLink(billText(bill, lang, settings), bill.customerPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#25D366] px-3 py-2.5 text-center font-semibold text-white"
          >
            {t.shareBill}
          </a>
          {due && (
            <button type="button" onClick={onMarkPaid} className="col-span-2 rounded-xl bg-green-700 px-3 py-2.5 font-semibold text-white">
              ✓ {t.markPaid}
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2.5 text-stone-800 ring-1 ring-stone-300">
            {t.close}
          </button>
          <button
            type="button"
            onClick={() => window.confirm(t.confirmDeleteBill) && onDelete()}
            className="rounded-xl px-3 py-2.5 text-red-700 ring-1 ring-red-200"
          >
            {t.deleteBill}
          </button>
        </div>
      </div>
    </div>
  );
}
