"use client";

// 🏠 Home: the dealer's dashboard. What it shows is chosen in Settings.

import CropImage from "@/components/CropImage";
import { billTotal, creditDue, salesOn, type Bill } from "@/lib/billing";
import { CROPS, type Lang } from "@/lib/crops";
import { dateTime, rupees } from "@/lib/format";
import { isBannedProduct, type Product } from "@/lib/inventory";
import type { RecentCase } from "@/lib/recent";
import type { Settings } from "@/lib/settings";
import { TEXT, fill } from "@/lib/text";
import { useNow } from "@/lib/useNow";

export type NavTarget = "check" | "bill" | "shop" | "recent" | "settings";

type Props = {
  lang: Lang;
  settings: Settings;
  products: Product[];
  bills: Bill[];
  recent: RecentCase[];
  go: (tab: NavTarget) => void;
};

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-bold text-stone-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function HomeView({ lang, settings, products, bills, recent, go }: Props) {
  const t = TEXT[lang];
  const now = useNow();
  const today = salesOn(bills, now);
  const credit = creditDue(bills);
  const low = products
    .filter((p) => p.qty <= settings.lowStockAt && !isBannedProduct(p))
    .sort((a, b) => a.qty - b.qty);
  const dayOfYear = Math.floor((now - new Date(new Date(now).getFullYear(), 0, 0).getTime()) / 86_400_000);
  const tip = t.tips[dayOfYear % t.tips.length];
  const show = settings.home;
  const viewAll = (tab: NavTarget) => (
    <button type="button" onClick={() => go(tab)} className="text-sm font-medium text-green-800 hover:underline">
      {t.viewAll}
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          {t.greeting}
          {settings.ownerName ? `, ${settings.ownerName}` : ""} 🙏
        </h1>
        <p className="text-stone-600">{t.homeSub}</p>
      </div>

      {!settings.shopName && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 ring-1 ring-sky-200">
          <span>ℹ️ {t.setupPrompt}</span>
          <button type="button" onClick={() => go("settings")} className="rounded-lg bg-sky-700 px-3 py-1.5 font-semibold text-white">
            {t.openSettings}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: t.quickCheck, tab: "check" as const, style: "bg-green-700 text-white hover:bg-green-800" },
          { label: t.quickBill, tab: "bill" as const, style: "bg-white text-stone-900 ring-1 ring-stone-200 hover:bg-stone-50" },
          { label: t.quickProduct, tab: "shop" as const, style: "bg-white text-stone-900 ring-1 ring-stone-200 hover:bg-stone-50" },
        ].map((a) => (
          <button key={a.tab} type="button" onClick={() => go(a.tab)} className={`rounded-2xl px-2 py-4 text-sm font-semibold shadow-sm sm:text-base ${a.style}`}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {show.sales && (
          <Card title={t.todaySales} action={viewAll("bill")}>
            <p className="text-3xl font-bold text-green-800">{rupees(today.total)}</p>
            <p className="text-sm text-stone-500">{fill(t.billsCount, { n: today.count })}</p>
            <p className="mt-2 text-sm text-stone-700">
              {t.cashToday}: <span className="font-semibold">{rupees(today.cash)}</span>
            </p>
          </Card>
        )}

        {show.credit && (
          <Card title={t.creditDue} action={viewAll("bill")}>
            <p className="text-3xl font-bold text-amber-600">{rupees(credit.total)}</p>
            <p className="text-sm text-stone-500">{fill(t.creditCount, { n: credit.count })}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {credit.bills.slice(0, 3).map((b) => (
                <li key={b.id} className="flex justify-between gap-2 text-stone-700">
                  <span className="truncate">{b.customerName || t.walkIn}</span>
                  <span className="font-medium">{rupees(billTotal(b))}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {show.lowStock && (
          <Card title={`⚠ ${t.lowStock}`} action={viewAll("shop")}>
            {low.length === 0 ? (
              <p className="text-sm text-stone-500">{t.lowStockNone}</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {low.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-stone-800">{p.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${p.qty === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                      {p.qty === 0 ? t.outBadge : fill(t.left, { n: p.qty })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {show.recent && (
          <Card title={t.recentTitle} action={viewAll("recent")}>
            {recent.length === 0 ? (
              <p className="text-sm text-stone-500">{t.recentEmpty}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recent.slice(0, 3).map((c) => {
                  const crop = CROPS.find((x) => x.id === c.result.crop);
                  return (
                    <li key={c.id} className="flex items-center gap-2">
                      <CropImage crop={c.result.crop} size={36} className="shrink-0 rounded-lg" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-stone-900">
                          {c.result.status === "ok" ? c.result.causes[0]?.name : `⚠ ${t.unsureShort}`}
                        </span>
                        <span className="block text-xs text-stone-500">
                          {crop?.[lang]} · {dateTime(c.at, lang)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

        {show.tips && (
          <Card title={`💡 ${t.tipTitle}`}>
            <p className="text-sm text-stone-700">{tip}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
