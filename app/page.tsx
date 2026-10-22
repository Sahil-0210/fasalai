"use client";

// The one screen: pick crop + language, add a photo and/or description,
// tap Diagnose, see the result card.

import { useEffect, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import ResultCard from "@/components/ResultCard";
import UnsureCard from "@/components/UnsureCard";
import { CROPS, LANGS, type CropId, type Lang } from "@/lib/crops";
import type { Diagnosis } from "@/lib/schema";
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

export default function Home() {
  const [crop, setCrop] = useState<CropId>(CROPS[0].id);
  const [lang, setLang] = useState<Lang>("en");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TEXT[lang];
  const speechLang = LANGS.find((l) => l.id === lang)!.speech;

  // Free the photo preview's memory when it changes.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

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
      form.append("text", text.trim());
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
      if (data.status === "error") setError(data.message);
      else setResult(data);
    } catch {
      setError(t.errNetwork);
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    clearPhoto();
    setText("");
    setError(null);
    setResult(null);
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <header className="mb-5">
        <h1 className="text-3xl font-bold text-green-800">🌱 FasalAI</h1>
        <p className="text-gray-600">{t.tagline}</p>
      </header>

      <form onSubmit={diagnose} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">{t.crop}</span>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value as CropId)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-900"
            >
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c[lang]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">{t.language}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-900"
            >
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700">{t.photo}</span>
          {previewUrl ? (
            <div className="mt-1 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview, not a hosted image */}
              <img src={previewUrl} alt="" className="h-24 w-24 rounded-lg border object-cover" />
              <button type="button" onClick={clearPhoto} className="text-sm text-red-700 underline">
                {t.removePhoto}
              </button>
            </div>
          ) : (
            <label className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-5 text-center text-gray-600 hover:bg-gray-50">
              <span className="text-2xl" aria-hidden>📷</span>
              <span className="text-sm">{t.photoHint}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
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
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-gray-900"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-green-700 px-4 py-3 text-lg font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? t.checking : t.diagnose}
          </button>
          {(result || photo || text) && !loading && (
            <button
              type="button"
              onClick={startOver}
              className="rounded-lg border border-gray-300 px-4 py-3 text-gray-800 hover:bg-gray-50"
            >
              {t.startOver}
            </button>
          )}
        </div>
      </form>

      <div className="mt-5">
        {result?.status === "ok" && <ResultCard result={result} t={t} />}
        {result?.status === "unsure" && <UnsureCard result={result} t={t} />}
      </div>
    </main>
  );
}
