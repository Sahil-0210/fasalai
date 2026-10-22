// The one place that talks to the AI, through OpenRouter. Runs only on the server.
// OpenRouter is one account that can reach many AI models (Claude, Gemini, GPT...).
// It sends the instructions + photo and returns the AI's answer, checked
// against AiAnswerSchema. If anything goes wrong it throws, and the route
// shows the "Unsure" card instead.

import { buildPrompt } from "./prompt";
import { AiAnswerSchema, type AiAnswer } from "./schema";
import type { CropId, Lang } from "./crops";

// Change the model in .env.local (OPENROUTER_MODEL) without touching code.
// It must be a model that accepts images; see https://openrouter.ai/models
const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";
const TIMEOUT_MS = 25_000;

export class AiTimeoutError extends Error {}

type AskInput = {
  apiKey: string;
  crop: CropId;
  lang: Lang;
  text: string;
  photo: File | null;
};

export async function askAI({ apiKey, crop, lang, text, photo }: AskInput): Promise<AiAnswer> {
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const content: object[] = [{ type: "text", text: buildPrompt({ crop, lang, text, hasPhoto: Boolean(photo) }) }];
  if (photo) {
    const base64 = Buffer.from(await photo.arrayBuffer()).toString("base64");
    content.push({ type: "image_url", image_url: { url: `data:${photo.type};base64,${base64}` } });
  }

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
        max_tokens: 1500,
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
  const json = reply.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
  return AiAnswerSchema.parse(JSON.parse(json));
}
