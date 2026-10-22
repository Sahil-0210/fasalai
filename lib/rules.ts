// The safety rules. Plain code, no AI, so they behave the same every time.
// Whatever the AI writes, these run before anything reaches the screen:
//   1. Unsure gate: bad photo, no causes, or low confidence -> "Unsure".
//   2. Dose stripper: any sentence with a quantity (2 ml, 500 g/acre...) is removed.
//   3. Banned-product block: any sentence naming a banned pesticide is removed.
//   4. Product suggestions must come from the dealer's own list, never banned.
//   5. "Read the label for dose" is always added.

import { BANNED_PESTICIDES } from "./banned";
import type { CropId, Lang } from "./crops";
import type { Product } from "./inventory";
import type { AiAnswer, Cause, ConfidenceLevel, Diagnosis, SuggestedProduct } from "./schema";
import { TEXT } from "./text";

// If the most likely cause is below this, we say "Unsure" instead of guessing.
export const UNSURE_THRESHOLD = 0.6;
const MAX_CAUSES = 3;

export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.75) return "High";
  if (confidence >= 0.5) return "Medium";
  return "Low";
}

// --- Dose stripper -------------------------------------------------------

// A number like 2, 2.5, 1-2, 1 to 2, or Hindi digits २
const NUM = String.raw`[0-9०-९]+(?:[.,][0-9०-९]+)?(?:\s*(?:-|–|to|से)\s*[0-9०-९]+(?:[.,][0-9०-९]+)?)?`;
// Units in English. (?![a-z]) stops "2 leaves" matching as "2 l".
const EN_UNIT = String.raw`(?:ml|millilit(?:re|er)s?|lit(?:re|er)s?|ltrs?|l|gms?|grams?|g|kgs?|kilo(?:gram)?s?|%|ppm|cc|tbsp|tsp|table ?spoons?|tea ?spoons?|caps?|capfuls?)(?![a-z])`;
// Hindi and Marathi units (Marathi often writes लिटर, एकर).
const HI_UNIT = String.raw`(?:मिली|मि\.ली\.|एमएल|ग्राम|ग्रॅम|किलो|किग्रा|लीटर|लिटर|प्रतिशत|टक्के|ढक्कन|झाकण)`;

const DOSE = new RegExp(`${NUM}\\s*(?:${EN_UNIT}|${HI_UNIT})`, "i");
// "per acre", "/litre", "प्रति एकड़" etc. are always dose talk, even without a number.
const PER_AREA =
  /(?:\bper\s+|\/\s*)(?:acre|hectare|ha|litre|liter|ltr|l|pump|tank|bigha|kanal)(?![a-z])|प्रति\s*(?:एकड़|एकर|लीटर|लिटर|हेक्टेयर|हेक्टर|टंकी|टाकी|पंप|बीघा)/i;

export function hasDose(sentence: string): boolean {
  return DOSE.test(sentence) || PER_AREA.test(sentence);
}

// --- Banned-product block -------------------------------------------------

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BANNED = BANNED_PESTICIDES.map((name) =>
  /^[a-z ]+$/i.test(name)
    ? new RegExp(`\\b${escapeRegex(name)}\\b`, "i") // whole word for English names
    : new RegExp(escapeRegex(name)), // plain match for Hindi names
);

export function hasBanned(sentence: string): boolean {
  return BANNED.some((re) => re.test(sentence));
}

// --- Cleaning text ---------------------------------------------------------

// Split after . ! ? or the Hindi full stop । (only when followed by a space,
// so "2.5" stays whole), and on new lines.
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type CleanResult = { text: string; removedBanned: boolean };

// Removes every sentence that has a dose or a banned pesticide.
export function cleanText(text: string): CleanResult {
  let removedBanned = false;
  const kept = splitSentences(text).filter((sentence) => {
    if (hasBanned(sentence)) {
      removedBanned = true;
      return false;
    }
    return !hasDose(sentence);
  });
  return { text: kept.join(" "), removedBanned };
}

function cleanList(items: string[]): { items: string[]; removedBanned: boolean } {
  let removedBanned = false;
  const cleaned: string[] = [];
  for (const item of items) {
    const r = cleanText(item);
    removedBanned ||= r.removedBanned;
    if (r.text) cleaned.push(r.text);
  }
  return { items: cleaned, removedBanned };
}

// --- Putting it together -----------------------------------------------------

// --- Products from the dealer's shop -------------------------------------------

const MAX_PRODUCTS = 3;

// The products the AI may choose from: never banned ones, and only those
// meant for this crop (an empty crop list means "any crop").
export function shopForCrop(inventory: Product[], crop: CropId): Product[] {
  return inventory.filter(
    (p) => !hasBanned(`${p.name} ${p.ingredient}`) && (p.crops.length === 0 || p.crops.includes(crop)),
  );
}

// Keeps only real products from the shop list (the AI can't invent one),
// removes doses from the reason, and puts in-stock products first.
function pickProducts(picks: AiAnswer["products"], shop: Product[]): { products: SuggestedProduct[]; removedBanned: boolean } {
  let removedBanned = false;
  const seen = new Set<string>();
  const products: SuggestedProduct[] = [];
  for (const pick of picks) {
    const product = shop.find((p) => p.id === pick.id);
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    const why = cleanText(pick.why);
    removedBanned ||= why.removedBanned;
    products.push({
      id: product.id,
      name: product.name,
      kind: product.kind,
      ingredient: product.ingredient,
      inStock: product.inStock,
      why: why.text,
    });
  }
  products.sort((a, b) => Number(b.inStock) - Number(a.inStock));
  return { products: products.slice(0, MAX_PRODUCTS), removedBanned };
}

// --- Putting it together -----------------------------------------------------

type DecideOptions = {
  lang: Lang;
  crop: CropId;
  hasPhoto: boolean;
  demo: boolean;
  shop: Product[]; // already filtered with shopForCrop
  shopChecked: boolean;
};

// Turns the AI's raw answer into what the dealer sees.
export function decide(answer: AiAnswer, { lang, crop, hasPhoto, demo, shop, shopChecked }: DecideOptions): Diagnosis {
  const t = TEXT[lang];
  let removedBanned = false;

  const causes: Cause[] = [...answer.causes]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_CAUSES)
    .map((c) => {
      const name = cleanText(c.name);
      const checks = cleanList(c.checks);
      removedBanned ||= name.removedBanned || checks.removedBanned;
      return {
        name: name.text,
        confidence: c.confidence,
        level: confidenceLevel(c.confidence),
        checks: checks.items,
      };
    })
    .filter((c) => c.name);

  const treatment = cleanText(answer.treatment_type);
  const safety = cleanText(answer.safety_note);
  const reason = cleanText(answer.unsure_reason);
  removedBanned ||= treatment.removedBanned || safety.removedBanned || reason.removedBanned;

  const topConfidence = causes[0]?.confidence ?? 0;
  const badPhoto = hasPhoto && !answer.image_ok;

  if (badPhoto || causes.length === 0 || topConfidence < UNSURE_THRESHOLD) {
    // Never show cause names or products here: that would be a guess.
    // The AI's "what to check" points are still useful next steps.
    const aiChecks = [...new Set(causes.flatMap((c) => c.checks))].slice(0, 3);
    return {
      status: "unsure",
      crop,
      reason: reason.text || t.unsureReasonDefault,
      nextSteps: [...aiChecks, ...t.unsureSteps],
      warnings: removedBanned ? [t.bannedWarning] : [],
      demo,
    };
  }

  const picked = pickProducts(answer.products, shop);
  removedBanned ||= picked.removedBanned;

  return {
    status: "ok",
    crop,
    causes,
    treatmentType: treatment.text || t.treatmentFallback,
    safetyNote: safety.text || t.safetyFallback,
    labelLine: t.labelLine,
    products: picked.products,
    shopChecked,
    warnings: removedBanned ? [t.bannedWarning] : [],
    demo,
  };
}

// Used when the AI times out or sends back something we can't read.
export function unsureBecause(reason: string, lang: Lang, crop: CropId, demo: boolean): Diagnosis {
  return { status: "unsure", crop, reason, nextSteps: TEXT[lang].unsureSteps, warnings: [], demo };
}
