// The instructions we give the AI. Edit the wording here to change its behaviour.
// The safety rules in rules.ts still run afterwards, so even if the AI ignores
// an instruction (e.g. writes a dose or invents a product), the dealer never sees it.

import { cropName, LANGS, stageName, type CropId, type Lang, type StageId } from "./crops";
import type { Product } from "./inventory";

type PromptInput = {
  crop: CropId;
  stage: StageId | null;
  lang: Lang;
  text: string;
  hasPhoto: boolean;
  shop: Product[];
};

function shopLines(shop: Product[]): string {
  if (shop.length === 0) return "(the dealer has no products listed; return an empty products list)";
  return shop
    .map((p) => `${p.id} | ${p.name} | ${p.kind} | ${p.ingredient || "-"} | ${p.qty > 0 ? "in stock" : "out of stock"}`)
    .join("\n");
}

export function buildPrompt({ crop, stage, lang, text, hasPhoto, shop }: PromptInput): string {
  const cropEn = cropName(crop, "en");
  const language = LANGS.find((l) => l.id === lang)!.aiName;

  return `You help an agri-input dealer (krushi seva kendra) in Maharashtra, India work out what is wrong with a farmer's crop.

Crop: ${cropEn}
Crop stage: ${stage ? stageName(stage, "en") : "not given"}
Write every text field in: ${language}
${hasPhoto ? "A photo of the affected plant is attached." : "No photo was given; use only the description."}
Farmer's description (may be in Marathi, Hindi, English or a mix; may be empty):
"""
${text || "(none)"}
"""

The dealer's products (id | name | type | active ingredient | stock):
${shopLines(shop)}

Rules:
- image_ok: if a photo is attached, true only if it clearly shows a ${cropEn} plant or plant part with enough detail to judge. Blurry, dark, not a plant, or a different crop -> false. If no photo, set true.
- causes: up to 3 likely causes (diseases, pests, nutrient deficiencies or other problems) common in Maharashtra, most likely first. Each has:
  - name: short common name, with the local Marathi/Hindi name in brackets if helpful
  - confidence: 0 to 1, honest. A low number is better than a confident wrong answer.
  - checks: 2 to 4 short things the dealer can look at or ask the farmer that would tell this cause apart from the others.
- If you cannot tell, return an empty causes list and explain why in unsure_reason.
- treatment_type: the general type of treatment only (e.g. "fungicide", "insecticide for sucking pests", "zinc micronutrient", "remove infected plants"). NEVER give doses, quantities, mixing rates, intervals in numbers, or brand names.
- safety_note: one or two short sentences on safe handling (protective gear, waiting period before harvest, bees, water).
- products: up to 3 products from the dealer's list above that suit the MOST LIKELY cause, best first. Use the exact id. Prefer products in stock. "why" is one short sentence on what it targets, with no doses. Suggest a fertiliser only if a likely cause is a nutrient deficiency. Never invent products; if nothing fits, return [].
- Never mention banned or restricted pesticides.
- unsure_reason: one short sentence if you are unsure or the photo is bad, otherwise "".

Reply with only this JSON, nothing else:
{"image_ok": boolean, "causes": [{"name": string, "confidence": number, "checks": [string]}], "treatment_type": string, "safety_note": string, "unsure_reason": string, "products": [{"id": string, "why": string}]}`;
}
