"use client";

// 🩺 Check crop: pick crop -> add photo/description -> see result.
// On a laptop the form is on the left and the result on the right.
// If the dealer changes the language after a result, the result is translated.

import { useEffect, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import ResultCard from "@/components/ResultCard";
import UnsureCard from "@/components/UnsureCard";
import { LANGS, STAGES, type CropId, type Lang, type StageId } from "@/lib/crops";
import type { Product } from "@/lib/inventory";
import type { Diagnosis, Result, SuggestedProduct } from "@/lib/schema";
import { visibleCrops, type Settings } from "@/lib/settings";
import { TEXT } from "@/lib/text";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024; // 15 MB, before shrinking
const MAX_SIDE_PX = 1024; // photos are shrunk to this size before sending
const REQUEST_TIMEOUT_MS = 40_000;

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

export function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-sm text-white">{n}</span>
      {children}
    </h2>
  );
}

type Props = {
  lang: Lang;
  settings: Settings;
  products: Product[];
  onResult: (result: Result) => void;
  onAddToBill: (product: SuggestedProduct) => void;
  inBill: (productId: string) => boolean;
};

export default function CheckView({ lang, settings, products, onResult, onAddToBill, inBill }: Props) {
  const t = TEXT[lang];
  const crops = visibleCrops(settings);
  const [crop, setCrop] = useState<CropId>(crops[0].id);
  const [stage, setStage] = useState<StageId | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The same result in each language it has been shown in.
  const [results, setResults] = useState<Partial<Record<Lang, Result>>>({});
  const [translating, setTranslating] = useState(false);
  const [translateFailed, setTranslateFailed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const speechLang = LANGS.find((l) => l.id === lang)!.speech;
  const original = Object.values(results)[0];
  const result = results[lang] ?? original;
  const selectedCrop = crops.some((c) => c.id === crop) ? crop : crops[0].id;

  // Free the photo preview's memory when it changes.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Language changed while a result is showing -> translate it (once per language).
  useEffect(() => {
    if (!original || results[lang]) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows "Translating…" while the request runs
    setTranslating(true);
    setTranslateFailed(false);
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: original, lang }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) setResults((prev) => ({ ...prev, [lang]: data.result }));
        else setTranslateFailed(true);
      })
      .catch(() => !cancelled && setTranslateFailed(true))
      .finally(() => !cancelled && setTranslating(false));
    return () => {
      cancelled = true;
    };
  }, [lang, original, results]);

  function clearPhoto() {
    setPhoto(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function acceptFile(file: File | undefined) {
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  async function diagnose(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setResults({});
    setTranslateFailed(false);

    if (!photo && text.trim().length < 5) {
      setError(t.errEmpty);
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("crop", selectedCrop);
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
        setResults({ [data.lang]: data });
        onResult(data);
        // On phones the result is below the form: scroll to it.
        requestAnimationFrame(() => {
          if (window.innerWidth < 1024) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
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
    setResults({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <form ref={formRef} onSubmit={diagnose} className="space-y-4">
        {/* Step 1: crop and stage */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <StepTitle n={1}>{t.step1}</StepTitle>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {crops.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCrop(c.id)}
                aria-pressed={selectedCrop === c.id}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center transition ${
                  selectedCrop === c.id
                    ? "bg-green-700 text-white shadow-md ring-2 ring-green-700"
                    : "bg-stone-50 text-stone-800 ring-1 ring-stone-200 hover:bg-green-50"
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
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-6 text-center transition ${
                dragging ? "border-green-600 bg-green-100" : "border-green-300 bg-green-50/50 hover:bg-green-50"
              }`}
            >
              <span className="text-4xl" aria-hidden>
                {dragging ? "📥" : "📷"}
              </span>
              <span className="font-medium text-green-900">{dragging ? t.dropHere : t.photoHint}</span>
              {!dragging && <span className="hidden text-sm text-green-800 sm:block">{t.dragHint}</span>}
              <span className="text-xs text-stone-500">{t.photoTip}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => acceptFile(e.target.files?.[0])}
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
            onKeyDown={(e) => {
              // Enter runs the check; Shift+Enter makes a new line.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            placeholder={t.descriptionPlaceholder}
            rows={3}
            maxLength={2000}
            className="mt-1.5 w-full rounded-xl border border-stone-300 p-3 text-stone-900"
          />
          <p className="mt-1 hidden text-xs text-stone-400 sm:block">{t.enterHint}</p>
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

      {/* Step 3: result (right column on laptops) */}
      <div ref={resultRef} className="scroll-mt-4 lg:sticky lg:top-4">
        <StepTitle n={3}>{t.step3}</StepTitle>
        {translating && (
          <p className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">⏳ {t.translating}</p>
        )}
        {translateFailed && !translating && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t.translateFailed}</p>
        )}
        {loading ? (
          <div className="space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200/70" />
            ))}
          </div>
        ) : result?.status === "ok" ? (
          <ResultCard result={result} settings={settings} onAddToBill={onAddToBill} inBill={inBill} />
        ) : result?.status === "unsure" ? (
          <UnsureCard result={result} />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 p-6 text-center">
            <div className="text-5xl" aria-hidden>
              🌿
            </div>
            <h3 className="mt-2 text-lg font-bold text-stone-800">{t.emptyResultTitle}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">{t.emptyResultText}</p>
            <ul className="mx-auto mt-4 grid max-w-sm gap-2 text-left">
              {t.emptySteps.map((s, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  <span className="text-green-700">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
