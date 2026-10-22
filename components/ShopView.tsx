"use client";

// "My Shop": the dealer's product list. Upload a CSV (from Excel), or add and
// edit products by hand. FasalAI only ever suggests products from this list.

import { useState } from "react";
import { CROPS, type Lang } from "@/lib/crops";
import {
  CSV_TEMPLATE,
  PRODUCT_KINDS,
  SAMPLE_INVENTORY,
  inventoryToCsv,
  isBannedProduct,
  newProductId,
  parseInventoryCsv,
  type Product,
} from "@/lib/inventory";
import { TEXT, fill } from "@/lib/text";

type Props = {
  lang: Lang;
  products: Product[];
  isSample: boolean;
  onChange: (products: Product[]) => void;
};

function download(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const EMPTY: Product = { id: "", name: "", kind: "fungicide", ingredient: "", crops: [], inStock: true };

export default function ShopView({ lang, products, isSample, onChange }: Props) {
  const t = TEXT[lang];
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const inStockCount = products.filter((p) => p.inStock).length;
  const query = search.trim().toLowerCase();
  const shown = query
    ? products.filter((p) => `${p.name} ${p.ingredient} ${t.kinds[p.kind]}`.toLowerCase().includes(query))
    : products;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = parseInventoryCsv(await file.text());
      if (parsed.length === 0) throw new Error("empty");
      if (!isSample && products.length > 0 && !window.confirm(t.confirmReplace)) return;
      onChange(parsed);
      setMessage({ ok: true, text: fill(t.importDone, { n: parsed.length }) });
    } catch {
      setMessage({ ok: false, text: t.importError });
    }
  }

  function saveProduct(product: Product) {
    if (!product.name.trim()) return;
    const exists = products.some((p) => p.id === product.id);
    const clean = { ...product, name: product.name.trim(), ingredient: product.ingredient.trim() };
    onChange(exists ? products.map((p) => (p.id === clean.id ? clean : p)) : [{ ...clean, id: newProductId() }, ...products]);
    setEditing(null);
  }

  function toggleStock(id: string) {
    onChange(products.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p)));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-lg font-bold text-stone-900">🏪 {t.shopTitle}</h2>
        <p className="mt-0.5 text-sm text-stone-500">{t.shopIntro}</p>
        <p className="mt-2 text-sm font-medium text-stone-800">
          {fill(t.productsCount, { n: products.length, s: inStockCount })}
        </p>
        {isSample && (
          <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 ring-1 ring-sky-200">ℹ️ {t.sampleNotice}</p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="col-span-2 flex cursor-pointer items-center justify-center rounded-xl bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800">
            {t.uploadCsv}
            <input type="file" accept=".csv,text/csv" onChange={handleUpload} className="sr-only" />
          </label>
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY })}
            className="col-span-2 rounded-xl px-4 py-3 font-semibold text-green-800 ring-2 ring-green-700 hover:bg-green-50"
          >
            {t.addProduct}
          </button>
          <button type="button" onClick={() => download("fasalai-template.csv", CSV_TEMPLATE)} className="rounded-lg px-2 py-2 text-sm text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50">
            {t.downloadTemplate}
          </button>
          <button type="button" onClick={() => download("my-shop.csv", inventoryToCsv(products))} className="rounded-lg px-2 py-2 text-sm text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50">
            {t.exportCsv}
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">{t.csvHelp}</p>

        {message && (
          <p role="status" className={`mt-3 rounded-lg p-3 text-sm font-medium ${message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {message.text}
          </p>
        )}
      </div>

      {editing && (
        <ProductForm lang={lang} initial={editing} onSave={saveProduct} onCancel={() => setEditing(null)} />
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`🔍 ${t.searchProducts}`}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        />
        <ul className="mt-3 divide-y divide-stone-100">
          {shown.map((p) => {
            const banned = isBannedProduct(p);
            return (
              <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className={`font-semibold ${banned ? "text-red-700 line-through" : "text-stone-900"}`}>{p.name}</p>
                  <p className="text-xs text-stone-500">
                    {t.kinds[p.kind]}
                    {p.ingredient && ` · ${p.ingredient}`}
                    {" · "}
                    {p.crops.length ? p.crops.map((id) => CROPS.find((c) => c.id === id)?.[lang]).join(", ") : t.allCrops}
                  </p>
                  {banned && <p className="mt-0.5 text-xs font-semibold text-red-700">⛔ {t.bannedInShop}</p>}
                  <div className="mt-1 flex gap-3 text-xs">
                    <button type="button" onClick={() => setEditing(p)} className="text-green-800 underline">
                      {t.edit}
                    </button>
                    <button type="button" onClick={() => onChange(products.filter((x) => x.id !== p.id))} className="text-red-700 underline">
                      {t.remove}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStock(p.id)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    p.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.inStock ? `✓ ${t.inStock}` : t.outOfStock}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex flex-wrap gap-3 border-t border-stone-100 pt-3 text-sm">
          {!isSample && (
            <button type="button" onClick={() => onChange(SAMPLE_INVENTORY)} className="text-stone-600 underline">
              {t.loadSample}
            </button>
          )}
          {products.length > 0 && (
            <button
              type="button"
              onClick={() => window.confirm(t.confirmClear) && onChange([])}
              className="text-red-700 underline"
            >
              {t.clearAll}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type FormProps = { lang: Lang; initial: Product; onSave: (p: Product) => void; onCancel: () => void };

function ProductForm({ lang, initial, onSave, onCancel }: FormProps) {
  const t = TEXT[lang];
  const [draft, setDraft] = useState<Product>(initial);
  const set = (patch: Partial<Product>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleCrop = (id: string) =>
    set({ crops: draft.crops.includes(id) ? draft.crops.filter((c) => c !== id) : [...draft.crops, id] });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-green-600"
    >
      <label className="block">
        <span className="text-sm font-medium text-stone-700">{t.productName}</span>
        <input
          required
          maxLength={80}
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">{t.productType}</span>
          <select
            value={draft.kind}
            onChange={(e) => set({ kind: e.target.value as Product["kind"] })}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-stone-900"
          >
            {PRODUCT_KINDS.map((k) => (
              <option key={k} value={k}>
                {t.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">{t.ingredient}</span>
          <input
            maxLength={120}
            value={draft.ingredient}
            onChange={(e) => set({ ingredient: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>
      </div>
      <div>
        <span className="text-sm font-medium text-stone-700">{t.forCrops}</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {CROPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCrop(c.id)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                draft.crops.includes(c.id) ? "bg-green-700 text-white" : "bg-stone-100 text-stone-700"
              }`}
            >
              {c.emoji} {c[lang]}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-stone-800">
        <input type="checkbox" checked={draft.inStock} onChange={(e) => set({ inStock: e.target.checked })} className="h-5 w-5 accent-green-700" />
        {t.inStock}
      </label>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-xl bg-green-700 px-4 py-2.5 font-semibold text-white hover:bg-green-800">
          {t.save}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50">
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
