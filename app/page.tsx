"use client";

// The whole app on one page. It holds the dealer's data (settings, products,
// bills, recent checks, the bill being made) and shows one screen at a time:
// Home, Check crop, Billing, My Shop, Recent, Help, Settings.
// Laptop: menu on the left. Phone: menu at the bottom.

import { useEffect, useState } from "react";
import BillingView, { itemFromProduct } from "@/components/BillingView";
import CheckView from "@/components/CheckView";
import HeaderArt from "@/components/HeaderArt";
import HelpView from "@/components/HelpView";
import HomeView from "@/components/HomeView";
import RecentView from "@/components/RecentView";
import SettingsView from "@/components/SettingsView";
import ShopView from "@/components/ShopView";
import { applyStock, parseBills, type Bill, type BillItem } from "@/lib/billing";
import { LANGS, isLang, type Lang } from "@/lib/crops";
import { InventorySchema, SAMPLE_INVENTORY, type Product } from "@/lib/inventory";
import { addRecent, parseRecent, type RecentCase } from "@/lib/recent";
import type { Result, SuggestedProduct } from "@/lib/schema";
import { DEFAULT_SETTINGS, parseSettings, type Settings } from "@/lib/settings";
import { KEYS } from "@/lib/storageKeys";
import { TEXT } from "@/lib/text";
import { useStored } from "@/lib/useStored";

type Tab = "home" | "check" | "bill" | "shop" | "recent" | "help" | "settings";

// Fixed "nothing saved yet" values (must not change between renders).
const NO_RECENT: RecentCase[] = [];
const NO_BILLS: Bill[] = [];
const parseLang = (v: unknown) => (isLang(v) ? v : null);
const parseInventory = (v: unknown) => {
  const r = InventorySchema.safeParse(v);
  return r.success ? r.data : null;
};

const NAV: { id: Tab; icon: string; key: keyof typeof TEXT.en }[] = [
  { id: "home", icon: "🏠", key: "navHome" },
  { id: "check", icon: "🩺", key: "navCheck" },
  { id: "bill", icon: "🧾", key: "navBill" },
  { id: "shop", icon: "🏪", key: "navShop" },
  { id: "recent", icon: "🕘", key: "navRecent" },
  { id: "help", icon: "❓", key: "navHelp" },
  { id: "settings", icon: "⚙️", key: "navSettings" },
];
const PHONE_NAV: Tab[] = ["home", "check", "bill", "shop"];

export default function Home() {
  const [settings, setSettings] = useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS, parseSettings);
  const [savedLang, setLang] = useStored<Lang | null>(KEYS.lang, null, parseLang);
  const [savedInventory, setInventory] = useStored<Product[] | null>(KEYS.inventory, null, parseInventory);
  const [bills, setBills] = useStored<Bill[]>(KEYS.bills, NO_BILLS, parseBills);
  const [recent, setRecent] = useStored<RecentCase[]>(KEYS.recent, NO_RECENT, parseRecent);
  const [tab, setTab] = useState<Tab>("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [cart, setCart] = useState<BillItem[]>([]);

  const lang = savedLang ?? settings.defaultLang;
  const products = savedInventory ?? SAMPLE_INVENTORY;
  const t = TEXT[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function go(next: Tab) {
    setTab(next);
    setMoreOpen(false);
    window.scrollTo({ top: 0 });
  }

  function addToBill(p: SuggestedProduct | Product) {
    if (!cart.some((i) => i.productId === p.id)) setCart([...cart, itemFromProduct(p)]);
  }

  function saveBill(bill: Bill) {
    setBills([bill, ...bills]);
    setInventory(applyStock(products, bill.items, -1));
  }

  function deleteBill(bill: Bill) {
    setBills(bills.filter((b) => b.id !== bill.id));
    setInventory(applyStock(products, bill.items, 1));
  }

  const navButton = (item: (typeof NAV)[number], compact = false) => (
    <button
      key={item.id}
      type="button"
      onClick={() => go(item.id)}
      aria-current={tab === item.id ? "page" : undefined}
      className={
        compact
          ? `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${tab === item.id ? "text-green-800" : "text-stone-500"}`
          : `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold ${
              tab === item.id ? "bg-green-700 text-white shadow-sm" : "text-stone-700 hover:bg-green-50"
            }`
      }
    >
      <span className={compact ? "text-xl" : "text-lg"} aria-hidden>
        {item.icon}
      </span>
      <span className="relative">
        {t[item.key] as string}
        {item.id === "bill" && cart.length > 0 && (
          <span className="ml-1 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-stone-900">{cart.length}</span>
        )}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Header with drawn field-and-leaves art */}
      <header className="relative overflow-hidden text-white">
        <HeaderArt />
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:py-7 lg:px-6">
          <button type="button" onClick={() => go("home")} className="min-w-0 text-left">
            <h1 className="text-2xl font-bold tracking-tight drop-shadow sm:text-3xl">🌱 FasalAI</h1>
            <p className="truncate text-sm text-green-50 drop-shadow">{settings.shopName || t.tagline}</p>
          </button>
          <label className="flex shrink-0 items-center gap-2 rounded-xl bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <span className="hidden text-sm text-green-50 sm:inline">🌐 {t.language}</span>
            <span className="text-sm sm:hidden" aria-hidden>
              🌐
            </span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label={t.language}
              className="rounded-lg bg-white px-2 py-1 text-sm font-semibold text-green-900"
            >
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-5 lg:px-6">
        {/* Laptop menu */}
        <nav className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-4 space-y-1 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-200">
            {NAV.map((item) => navButton(item))}
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          {tab === "home" && (
            <HomeView lang={lang} settings={settings} products={products} bills={bills} recent={recent} go={go} />
          )}
          {/* Kept on screen (just hidden) so a half-filled check isn't lost when switching screens. */}
          <div className={tab === "check" ? "" : "hidden"}>
            <CheckView
              lang={lang}
              settings={settings}
              products={products}
              onResult={(r: Result) => setRecent(addRecent(recent, r))}
              onAddToBill={addToBill}
              inBill={(id) => cart.some((i) => i.productId === id)}
            />
          </div>
          <div className={tab === "bill" ? "" : "hidden"}>
            <BillingView
              lang={lang}
              settings={settings}
              products={products}
              bills={bills}
              cart={cart}
              setCart={setCart}
              onSave={saveBill}
              onUpdate={(b) => setBills(bills.map((x) => (x.id === b.id ? b : x)))}
              onDelete={deleteBill}
            />
          </div>
          {tab === "shop" && (
            <ShopView
              lang={lang}
              lowStockAt={settings.lowStockAt}
              products={products}
              isSample={savedInventory === null}
              onChange={setInventory}
            />
          )}
          {tab === "recent" && <RecentView lang={lang} settings={settings} cases={recent} onClear={() => setRecent([])} />}
          {tab === "help" && <HelpView lang={lang} />}
          {tab === "settings" && <SettingsView lang={lang} settings={settings} onChange={setSettings} />}
        </main>
      </div>

      {/* Phone menu */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl">
          {PHONE_NAV.map((id) => navButton(NAV.find((n) => n.id === id)!, true))}
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            aria-expanded={moreOpen}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
              ["recent", "help", "settings"].includes(tab) ? "text-green-800" : "text-stone-500"
            }`}
          >
            <span className="text-xl" aria-hidden>
              ☰
            </span>
            {t.navMore}
          </button>
        </div>
      </nav>
      {moreOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-x-3 bottom-20 space-y-1 rounded-2xl bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {NAV.filter((n) => !PHONE_NAV.includes(n.id)).map((item) => navButton(item))}
          </div>
        </div>
      )}
    </div>
  );
}
