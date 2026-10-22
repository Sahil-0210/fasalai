// The crops and languages shown in the dropdowns.
// To change crops, edit this list. Keep it to 4 crops at most (MVP scope).

export const CROPS = [
  { id: "tomato", en: "Tomato", hi: "टमाटर" },
  { id: "potato", en: "Potato", hi: "आलू" },
  { id: "rice", en: "Rice (paddy)", hi: "धान" },
  { id: "chilli", en: "Chilli", hi: "मिर्च" },
] as const;

export const LANGS = [
  { id: "en", label: "English", speech: "en-IN", aiName: "English" },
  { id: "hi", label: "हिंदी", speech: "hi-IN", aiName: "Hindi (Devanagari script)" },
] as const;

export type CropId = (typeof CROPS)[number]["id"];
export type Lang = (typeof LANGS)[number]["id"];

export function isCropId(value: unknown): value is CropId {
  return CROPS.some((c) => c.id === value);
}

export function isLang(value: unknown): value is Lang {
  return LANGS.some((l) => l.id === value);
}

export function cropName(id: CropId, lang: Lang): string {
  const crop = CROPS.find((c) => c.id === id)!;
  return crop[lang];
}
