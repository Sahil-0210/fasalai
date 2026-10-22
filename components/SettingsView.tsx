"use client";

// ⚙️ Settings: shop details, default language, crops shown, Home screen
// widgets, low-stock level, bill note, and backup / restore.
// Every change saves straight away.

import { useState } from "react";
import { CROPS, LANGS, type CropId, type Lang } from "@/lib/crops";
import { HOME_WIDGETS, type Settings } from "@/lib/settings";
import { BACKUP_VERSION, KEYS } from "@/lib/storageKeys";
import { TEXT } from "@/lib/text";

type Props = { lang: Lang; settings: Settings; onChange: (s: Settings) => void };

function readAll(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of Object.values(KEYS)) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) data[key] = JSON.parse(raw);
    } catch {
      // skip unreadable entries
    }
  }
  return data;
}

function downloadBackup() {
  const backup = { app: "FasalAI", version: BACKUP_VERSION, at: new Date().toISOString(), data: readAll() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `fasalai-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const field = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900";

export default function SettingsView({ lang, settings, onChange }: Props) {
  const t = TEXT[lang];
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  function toggleCrop(id: CropId) {
    set({ crops: settings.crops.includes(id) ? settings.crops.filter((c) => c !== id) : [...settings.crops, id] });
  }

  async function restore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup?.app !== "FasalAI" || typeof backup.data !== "object") throw new Error("not a backup");
      if (!window.confirm(t.restoreConfirm)) return;
      const known = new Set<string>(Object.values(KEYS));
      for (const [key, value] of Object.entries(backup.data)) {
        if (known.has(key)) window.localStorage.setItem(key, JSON.stringify(value));
      }
      window.location.reload();
    } catch {
      setMessage({ ok: false, text: t.restoreError });
    }
  }

  function resetAll() {
    if (!window.confirm(t.resetConfirm)) return;
    for (const key of Object.values(KEYS)) window.localStorage.removeItem(key);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <h1 className="text-2xl font-bold text-stone-900">⚙️ {t.settingsTitle}</h1>
        <span className="text-sm font-medium text-green-700">{t.saved}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-bold text-stone-900">🏪 {t.shopDetails}</h2>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">{t.shopName}</span>
              <input value={settings.shopName} maxLength={80} onChange={(e) => set({ shopName: e.target.value })} className={field} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">{t.ownerName}</span>
                <input value={settings.ownerName} maxLength={80} onChange={(e) => set({ ownerName: e.target.value })} className={field} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">{t.shopPhone}</span>
                <input value={settings.phone} maxLength={20} inputMode="tel" onChange={(e) => set({ phone: e.target.value })} className={field} />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">{t.shopAddress}</span>
              <textarea value={settings.address} maxLength={200} rows={2} onChange={(e) => set({ address: e.target.value })} className={field} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">{t.billNote}</span>
              <input value={settings.billNote} maxLength={200} placeholder={t.billThanks} onChange={(e) => set({ billNote: e.target.value })} className={field} />
            </label>
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-bold text-stone-900">💾 {t.backupTitle}</h2>
            <p className="text-sm text-stone-600">{t.backupHint}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={downloadBackup} className="rounded-xl bg-green-700 px-4 py-2.5 font-semibold text-white hover:bg-green-800">
                {t.downloadBackup}
              </button>
              <label className="cursor-pointer rounded-xl px-4 py-2.5 text-center font-semibold text-green-800 ring-2 ring-green-700 hover:bg-green-50">
                {t.restoreBackup}
                <input type="file" accept="application/json,.json" onChange={restore} className="sr-only" />
              </label>
            </div>
            {message && (
              <p role="status" className={`rounded-lg p-3 text-sm font-medium ${message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                {message.text}
              </p>
            )}
            <button type="button" onClick={resetAll} className="text-sm text-red-700 underline">
              {t.resetAll}
            </button>
          </section>
        </div>

        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">{t.defaultLanguage}</span>
              <select value={settings.defaultLang} onChange={(e) => set({ defaultLang: e.target.value as Lang })} className={`${field} bg-white`}>
                {LANGS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">{t.lowStockAt}</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={settings.lowStockAt}
                onChange={(e) => set({ lowStockAt: Math.max(0, Math.min(1000, Math.floor(Number(e.target.value) || 0))) })}
                className={`${field} max-w-[8rem]`}
              />
            </label>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-bold text-stone-900">🏠 {t.homeWidgets}</h2>
            <div className="mt-2 space-y-2">
              {HOME_WIDGETS.map((w) => (
                <label key={w} className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2.5">
                  <span className="text-stone-800">{t.widgetNames[w]}</span>
                  <input
                    type="checkbox"
                    checked={settings.home[w]}
                    onChange={(e) => set({ home: { ...settings.home, [w]: e.target.checked } })}
                    className="h-5 w-5 accent-green-700"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-bold text-stone-900">🌾 {t.cropsShown}</h2>
            <p className="text-sm text-stone-500">{t.cropsShownHint}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CROPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCrop(c.id)}
                  aria-pressed={settings.crops.includes(c.id)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    settings.crops.includes(c.id) ? "bg-green-700 text-white" : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {c.emoji} {c[lang]}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
