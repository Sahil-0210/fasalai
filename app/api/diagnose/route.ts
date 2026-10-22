// The server route. The screen sends the form here; this is the only place
// that talks to the AI, so the API key never reaches the dealer's browser.
//
// Steps: check the input -> ask the AI (or use demo mode) -> run the safety
// rules -> send the cleaned result back.

import { isCropId, isLang, isStageId } from "@/lib/crops";
import { getDemoAnswer } from "@/lib/demo";
import { InventorySchema, type Product } from "@/lib/inventory";
import { AiTimeoutError, askAI } from "@/lib/openrouter";
import { decide, shopForCrop, unsureBecause } from "@/lib/rules";
import type { Diagnosis } from "@/lib/schema";
import { TEXT } from "@/lib/text";

// Give slow AI answers up to 30 seconds on Vercel.
export const maxDuration = 30;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// The browser shrinks photos before sending, so they're usually well under 1 MB.
// Vercel refuses requests over 4.5 MB, so we stop at 4 MB.
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_CHARS = 2000;
const MAX_INVENTORY_CHARS = 100_000;

function fail(message: string, status = 400) {
  return Response.json({ status: "error", message } satisfies Diagnosis, { status });
}

// The dealer's product list arrives as JSON text. If it's missing or broken,
// we carry on without product suggestions rather than failing the check.
function readInventory(raw: FormDataEntryValue | null): Product[] | null {
  if (typeof raw !== "string" || !raw || raw.length > MAX_INVENTORY_CHARS) return null;
  try {
    const parsed = InventorySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(TEXT.en.errBadRequest);
  }

  const lang = form.get("lang");
  const crop = form.get("crop");
  if (!isLang(lang) || !isCropId(crop)) return fail(TEXT.en.errBadRequest);
  const t = TEXT[lang];
  const stageField = form.get("stage");
  const stage = isStageId(stageField) ? stageField : null;

  const text = String(form.get("text") ?? "").trim().slice(0, MAX_TEXT_CHARS);
  const photoField = form.get("photo");
  const photo = photoField instanceof File && photoField.size > 0 ? photoField : null;

  if (!photo && text.length < 5) return fail(t.errEmpty);
  if (photo && !ALLOWED_TYPES.includes(photo.type)) return fail(t.errFileType);
  if (photo && photo.size > MAX_PHOTO_BYTES) return fail(t.errFileTooBig, 413);

  const inventory = readInventory(form.get("inventory"));
  const shop = shopForCrop(inventory ?? [], crop);
  const shopChecked = (inventory?.length ?? 0) > 0;
  const options = { lang, crop, hasPhoto: Boolean(photo), shop, shopChecked };

  // No key set -> demo mode with sample answers.
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const answer = await getDemoAnswer({ lang, text, fileName: photo?.name ?? "", shop });
    return Response.json(decide(answer, { ...options, demo: true }));
  }

  try {
    const answer = await askAI({ apiKey, crop, stage, lang, text, photo, shop });
    return Response.json(decide(answer, { ...options, demo: false }));
  } catch (err) {
    // Slow or broken AI answer: show "Unsure" rather than crash or guess.
    console.error("[diagnose]", err);
    const reason = err instanceof AiTimeoutError ? t.unsureReasonTimeout : t.unsureReasonBroken;
    return Response.json(unsureBecause(reason, lang, crop, false));
  }
}
