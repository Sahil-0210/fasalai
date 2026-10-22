// The crops, crop stages and languages shown on screen.
// Focused on Maharashtra's major crops. To change the crop list, edit CROPS.

export const CROPS = [
  { id: "soybean", emoji: "🫘", en: "Soybean", hi: "सोयाबीन", mr: "सोयाबीन" },
  { id: "cotton", emoji: "☁️", en: "Cotton", hi: "कपास", mr: "कापूस" },
  { id: "sugarcane", emoji: "🎋", en: "Sugarcane", hi: "गन्ना", mr: "ऊस" },
  { id: "onion", emoji: "🧅", en: "Onion", hi: "प्याज़", mr: "कांदा" },
  { id: "tur", emoji: "🫛", en: "Tur (pigeon pea)", hi: "अरहर (तुअर)", mr: "तूर" },
  { id: "chana", emoji: "🟤", en: "Chana (gram)", hi: "चना", mr: "हरभरा" },
  { id: "jowar", emoji: "🌾", en: "Jowar", hi: "ज्वार", mr: "ज्वारी" },
  { id: "wheat", emoji: "🌾", en: "Wheat", hi: "गेहूँ", mr: "गहू" },
  { id: "rice", emoji: "🌾", en: "Rice (paddy)", hi: "धान", mr: "भात" },
  { id: "tomato", emoji: "🍅", en: "Tomato", hi: "टमाटर", mr: "टोमॅटो" },
  { id: "grapes", emoji: "🍇", en: "Grapes", hi: "अंगूर", mr: "द्राक्ष" },
  { id: "pomegranate", emoji: "🔴", en: "Pomegranate", hi: "अनार", mr: "डाळिंब" },
  { id: "banana", emoji: "🍌", en: "Banana", hi: "केला", mr: "केळी" },
  { id: "orange", emoji: "🍊", en: "Orange (Nagpur)", hi: "संतरा", mr: "संत्रा" },
] as const;

// Optional: the crop's growth stage helps tell similar problems apart.
export const STAGES = [
  { id: "seedling", en: "Seedling", hi: "पौध", mr: "रोप अवस्था" },
  { id: "growing", en: "Growing", hi: "बढ़वार", mr: "वाढ" },
  { id: "flowering", en: "Flowering", hi: "फूल आना", mr: "फुलोरा" },
  { id: "fruiting", en: "Fruit / pod / boll", hi: "फल / फली / टिंडा", mr: "फळ / शेंगा / बोंड" },
] as const;

export const LANGS = [
  { id: "mr", label: "मराठी", speech: "mr-IN", aiName: "Marathi (Devanagari script)" },
  { id: "hi", label: "हिंदी", speech: "hi-IN", aiName: "Hindi (Devanagari script)" },
  { id: "en", label: "English", speech: "en-IN", aiName: "English" },
] as const;

export type CropId = (typeof CROPS)[number]["id"];
export type StageId = (typeof STAGES)[number]["id"];
export type Lang = (typeof LANGS)[number]["id"];

export function isCropId(value: unknown): value is CropId {
  return CROPS.some((c) => c.id === value);
}

export function isStageId(value: unknown): value is StageId {
  return STAGES.some((s) => s.id === value);
}

export function isLang(value: unknown): value is Lang {
  return LANGS.some((l) => l.id === value);
}

export function cropName(id: CropId, lang: Lang): string {
  return CROPS.find((c) => c.id === id)![lang];
}

export function stageName(id: StageId, lang: Lang): string {
  return STAGES.find((s) => s.id === id)![lang];
}
