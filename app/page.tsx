"use client";

// The app's one page, with three tabs:
//   🩺 Check crop: pick crop -> add photo/description -> see result
//   🏪 My Shop:    the dealer's product list
//   🕘 Recent:     the last 10 checks on this phone

import { useEffect, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import RecentView from "@/components/RecentView";
import ResultCard from "@/components/ResultCard";
import ShopView from "@/components/ShopView";
import UnsureCard from "@/components/UnsureCard";
import { CROPS, LANGS, STAGES, isLang, type CropId, type Lang, type StageId } from "@/lib/crops";
import { InventorySchema, SAMPLE_INVENTORY, type Product } from "@/lib/inventory";
import { addRecent, parseRecent, type RecentCase } from "@/lib/recent";
import type { Diagnosis } from "@/lib/schema";
import { TEXT } from "@/lib/text";
import { useStored } from "@/lib/useStored";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024; // 15 MB, before shrinking
const MAX_SIDE_PX = 1024; // photos are shrunk to this size before sending
const REQUEST_TIMEOUT_MS = 40_000;

type Tab = "diagnose" | "shop" | "recent";

// Fixed "nothing saved yet" values (must not change between renders).
const NO_RECENT: RecentCase[] = [];
const parseLang = (v: unknown) => (isLang(v) ? v : null);
const parseInventory = (v: unknown) => {
  const r = InventorySchema.safeParse(v);
  return r.success ? r.data : null;
};

// Shrinks the photo in the browser so it uploads fast (a few hundred KB).
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85),
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-sm text-white">{n}</span>
      {children}
    </h2>
  );
}

export default function Home() {
  const [lang, setLang] = useStored<Lang>("fasalai.lang", "mr", parseLang);
  const [savedInventory, setInventory] = useStored<Product[] | null>("fasalai.inventory.v1", null, parseInventory);
  const [recent, setRecent] = useStored<RecentCase[]>("fasalai.recent.v1", NO_RECENT, parseRecent);
  const products = savedInventory ?? SAMPLE_INVENTORY;

  const [tab, setTab] = useState<Tab>("diagnose");
  const [crop, setCrop] = useState<CropId>(CROPS[0].id);
  const [stage, setStage] = useState<StageId | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const t = TEXT[lang];
  const speechLang = LANGS.find((l) => l.id === lang)!.speech;

  // Free the photo preview's memory when it changes.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Bring the result into view when it arrives.
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  function clearPhoto() {
    setPhoto(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      clearPhoto();
      setError(t.errFileType);
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      clearPhoto();
      setError(t.errFileTooBig);
      return;
    }
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function diagnose(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!photo && text.trim().length < 5) {
      setError(t.errEmpty);
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("crop", crop);
      form.append("lang", lang);
      if (stage) form.append("stage", stage);
      form.append("text", text.trim());
      form.append("inventory", JSON.stringify(products));
      if (photo) {
        let small: Blob;
        try {
          small = await shrinkPhoto(photo);
        } catch {
          setError(t.errPhotoRead);
          return;
        }
        form.append("photo", small, photo.name);
      }

      const response = await fetch("/api/diagnose", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const data = (await response.json()) as Diagnosis;
      if (data.status === "error") {
        setError(data.message);
      } else {
        setResult(data);
        setRecent(addRecent(recent, data, lang));
      }
    } catch {
      setError(t.errNetwork);
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    clearPhoto();
    setText("");
    setStage(null);
    setError(null);
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "diagnose", label: t.tabDiagnose },
    { id: "shop", label: t.tabShop },
    { id: "recent", label: t.tabRecent },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-green-800 text-white">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 pb-3 pt-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">🌱 FasalAI</h1>
            <p className="truncate text-xs text-green-100">{t.tagline}</p>
          </div>
          <div className="flex shrink-0 rounded-full bg-green-900/60 p-0.5" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang(l.id)}
                aria-pressed={lang === l.id}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  lang === l.id ? "bg-white text-green-800" : "text-green-50 hover:bg-green-700"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-xl px-2">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              aria-current={tab === tb.id ? "page" : undefined}
              className={`flex-1 border-b-4 px-1 py-2.5 text-sm font-semibold ${
                tab === tb.id ? "border-amber-400 text-white" : "border-transparent text-green-100 hover:text-white"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-5">
        {tab === "shop" && (
          <ShopView lang={lang} products={products} isSample={savedInventory === null} onChange={setInventory} />
        )}

        {tab === "recent" && <RecentView lang={lang} cases={recent} onClear={() => setRecent([])} />}

        {tab === "diagnose" && (
          <>
            <form onSubmit={diagnose} className="space-y-4">
              {/* Step 1: crop and stage */}
              <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
                <StepTitle n={1}>{t.step1}</StepTitle>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {CROPS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCrop(c.id)}
                      aria-pressed={crop === c.id}
                      className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center ${
                        crop === c.id ? "bg-green-700 text-white ring-2 ring-green-700" : "bg-stone-50 text-stone-800 ring-1 ring-stone-200 hover:bg-green-50"
                      }`}
                    >
                      <span className="text-2xl" aria-hidden>
                        {c.emoji}
                      </span>
                      <span className="text-xs font-medium leading-tight">{c[lang]}</span>
                    </button>
                  ))}
                </div>

                <p className="mb-1.5 mt-4 text-sm font-medium text-stone-600">{t.stageLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStage(stage === s.id ? null : s.id)}
                      aria-pressed={stage === s.id}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        stage === s.id ? "bg-green-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-green-50"
                      }`}
                    >
                      {s[lang]}
                    </button>
                  ))}
                </div>
              </section>

              {/* Step 2: photo and description */}
              <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
                <StepTitle n={2}>{t.step2}</StepTitle>
                {previewUrl ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local preview, not a hosted image */}
                    <img src={previewUrl} alt="" className="h-28 w-28 rounded-xl object-cover ring-1 ring-stone-200" />
                    <button type="button" onClick={clearPhoto} className="text-sm text-red-700 underline">
                      {t.removePhoto}
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 p-6 text-center hover:bg-green-50">
                    <span className="text-4xl" aria-hidden>
                      📷
                    </span>
                    <span className="font-medium text-green-900">{t.photoHint}</span>
                    <span className="text-xs text-stone-500">{t.photoTip}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhoto}
                      className="sr-only"
                    />
                  </label>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <label htmlFor="description" className="text-sm font-medium text-stone-700">
                    {t.description}
                  </label>
                  <MicButton
                    speechLang={speechLang}
                    label={t.speak}
                    listeningLabel={t.listening}
                    onText={(spoken) => setText((prev) => (prev ? `${prev} ${spoken}` : spoken))}
                  />
                </div>
                <textarea
                  id="description"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.descriptionPlaceholder}
                  rows={3}
                  maxLength={2000}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 p-3 text-stone-900"
                />
              </section>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-green-700 px-4 py-4 text-lg font-bold text-white shadow-sm hover:bg-green-800 disabled:opacity-60"
                >
                  {loading ? `⏳ ${t.checking}` : `🔍 ${t.diagnose}`}
                </button>
                {(result || photo || text) && !loading && (
                  <button
                    type="button"
                    onClick={startOver}
                    className="rounded-xl bg-white px-4 py-4 text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50"
                  >
                    {t.startOver}
                  </button>
                )}
              </div>
            </form>

            {result && result.status !== "error" && (
              <div ref={resultRef} className="mt-6 scroll-mt-4">
                <StepTitle n={3}>{t.step3}</StepTitle>
                {result.status === "ok" ? (
                  <ResultCard result={result} lang={lang} />
                ) : (
                  <UnsureCard result={result} lang={lang} />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
