// The one place that talks to the AI, through OpenRouter. Runs only on the server.
// OpenRouter is one account that can reach many AI models (Claude, Gemini, GPT...).
// If anything goes wrong it throws, and the route shows the "Unsure" card
// (or keeps the original language) instead.

import { buildPrompt } from "./prompt";
import { AiAnswerSchema, type AiAnswer } from "./schema";
import { LANGS, type CropId, type Lang, type StageId } from "./crops";
import type { Product } from "./inventory";
import { z } from "zod";

// Change the model in .env.local (OPENROUTER_MODEL) without touching code.
// It must be a model that accepts images; see https://openrouter.ai/models
// Gemini 3.5 Flash-Lite: same answers as 3.8 Flash in our tests, 2-3 s instead of 5-20 s.
const DEFAULT_MODEL = "google/gemini-3.5-flash-lite";
const TIMEOUT_MS = 25_000;

export class AiTimeoutError extends Error {}

// Sends one message (text, plus an optional photo) and returns the AI's JSON reply.
async function callModel(apiKey: string, content: object[]): Promise<unknown> {
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-OpenRouter-Title": "FasalAI",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
        // Ask for JSON only, and keep answers steady rather than creative.
        response_format: { type: "json_object" },
        temperature: 0.2,
        // Less "thinking" time before answering: keeps checks well under 15 seconds.
        reasoning: { effort: "low" },
        max_tokens: 2500, // Marathi/Hindi text uses more tokens than English
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") throw new AiTimeoutError();
    throw err;
  }

  const data = await response.json().catch(() => null);
  const error = data?.error ?? data?.choices?.[0]?.error;
  if (!response.ok || error) {
    // Shown in the terminal / Vercel logs, never to the dealer. Never includes the key.
    throw new Error(`OpenRouter returned ${response.status} for model ${model}: ${JSON.stringify(error ?? data).slice(0, 500)}`);
  }

  const reply: string = data?.choices?.[0]?.message?.content ?? "";
  // Some models wrap the JSON in ```json fences; strip them before reading.
  return JSON.parse(reply.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ""));
}

type AskInput = {
  apiKey: string;
  crop: CropId;
  stage: StageId | null;
  lang: Lang;
  text: string;
  photo: File | null;
  shop: Product[];
};

// The crop check: photo + description -> likely causes, checks, products.
export async function askAI({ apiKey, photo, ...rest }: AskInput): Promise<AiAnswer> {
  const content: object[] = [{ type: "text", text: buildPrompt({ ...rest, hasPhoto: Boolean(photo) }) }];
  if (photo) {
    const base64 = Buffer.from(await photo.arrayBuffer()).toString("base64");
    content.push({ type: "image_url", image_url: { url: `data:${photo.type};base64,${base64}` } });
  }
  return AiAnswerSchema.parse(await callModel(apiKey, content));
}

// Translates a list of short texts into another language, keeping the order.
// Marathi and Hindi share a script, so the prompt insists on real translation.
export async function translateTexts(apiKey: string, texts: string[], from: Lang, to: Lang): Promise<string[]> {
  const source = LANGS.find((l) => l.id === from)!.aiName;
  const target = LANGS.find((l) => l.id === to)!.aiName;
  const prompt = `You are translating short texts in a crop-advice app for agri-input dealers in Maharashtra, India.
Source language: ${source}. Target language: ${target}.
Rewrite EVERY item fully in ${target}, using natural everyday words that farmers use. ${source} and ${target} can share a script, so do not copy the source words: translate them.
Keep chemical and product names as they are; for disease or pest names, give the ${target} name, with the English name in brackets if helpful.
Do not add doses, quantities or new information. Return exactly ${texts.length} items, in the same order.

Reply with only this JSON: {"items": [string]}

Items:
${JSON.stringify(texts)}`;
  const { items } = z.object({ items: z.array(z.string()) }).parse(await callModel(apiKey, [{ type: "text", text: prompt }]));
  if (items.length !== texts.length) throw new Error(`Translation returned ${items.length} items, expected ${texts.length}`);
  return items;
}
