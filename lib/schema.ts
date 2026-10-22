// The "shapes" of data in the app.
// AiAnswer is what the AI must send back. If its reply doesn't match,
// we treat the answer as broken and show "Unsure" instead of crashing.
// Diagnosis is what the server sends to the screen after the safety rules run.

import { z } from "zod";
import { CROPS, LANGS, type CropId, type Lang } from "./crops";
import { PRODUCT_KINDS } from "./inventory";

export const AiAnswerSchema = z.object({
  image_ok: z.boolean(),
  causes: z.array(
    z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      checks: z.array(z.string()),
    }),
  ),
  treatment_type: z.string(),
  safety_note: z.string(),
  unsure_reason: z.string().optional().default(""),
  // Products picked from the dealer's own list, by id.
  products: z.array(z.object({ id: z.string(), why: z.string() })).optional().default([]),
});

export type AiAnswer = z.infer<typeof AiAnswerSchema>;

const cropId = z.enum(CROPS.map((c) => c.id) as [CropId, ...CropId[]]);
const lang = z.enum(LANGS.map((l) => l.id) as [Lang, ...Lang[]]);

const CauseSchema = z.object({
  name: z.string(),
  confidence: z.number(),
  level: z.enum(["High", "Medium", "Low"]),
  checks: z.array(z.string()),
});

const SuggestedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(PRODUCT_KINDS),
  ingredient: z.string(),
  inStock: z.boolean(),
  qty: z.number(),
  price: z.number(),
  unit: z.string(),
  why: z.string(),
});

export const OkDiagnosisSchema = z.object({
  status: z.literal("ok"),
  crop: cropId,
  lang, // the language the text is written in
  causes: z.array(CauseSchema),
  treatmentType: z.string(),
  safetyNote: z.string(),
  labelLine: z.string(),
  products: z.array(SuggestedProductSchema),
  shopChecked: z.boolean(), // false when the dealer has no products saved
  warnings: z.array(z.string()),
  demo: z.boolean(),
});

export const UnsureDiagnosisSchema = z.object({
  status: z.literal("unsure"),
  crop: cropId,
  lang,
  reason: z.string(),
  nextSteps: z.array(z.string()),
  warnings: z.array(z.string()),
  demo: z.boolean(),
});

// A result that can be shown on screen (and saved, translated, re-opened).
export const ResultSchema = z.discriminatedUnion("status", [OkDiagnosisSchema, UnsureDiagnosisSchema]);

export type ConfidenceLevel = z.infer<typeof CauseSchema>["level"];
export type Cause = z.infer<typeof CauseSchema>;
export type SuggestedProduct = z.infer<typeof SuggestedProductSchema>;
export type OkDiagnosis = z.infer<typeof OkDiagnosisSchema>;
export type UnsureDiagnosis = z.infer<typeof UnsureDiagnosisSchema>;
export type Result = OkDiagnosis | UnsureDiagnosis;
export type Diagnosis = Result | { status: "error"; message: string };
