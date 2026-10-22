// The one place that talks to Google's Gemini AI. Runs only on the server.
// It sends the instructions + photo and returns the AI's answer, checked
// against AiAnswerSchema. If anything goes wrong it throws, and the route
// shows the "Unsure" card instead.

import { buildPrompt } from "./prompt";
import { AiAnswerSchema, type AiAnswer } from "./schema";
import type { CropId, Lang } from "./crops";

const DEFAULT_MODEL = "gemini-3.8-flash";
const TIMEOUT_MS = 25_000;

export class AiTimeoutError extends Error {}

type AskInput = {
  apiKey: string;
  crop: CropId;
  lang: Lang;
  text: string;
  photo: File | null;
};

export async function askGemini({ apiKey, crop, lang, text, photo }: AskInput): Promise<AiAnswer> {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const parts: object[] = [{ text: buildPrompt({ crop, lang, text, hasPhoto: Boolean(photo) }) }];
  if (photo) {
    const base64 = Buffer.from(await photo.arrayBuffer()).toString("base64");
    parts.push({ inline_data: { mime_type: photo.type, data: base64 } });
  }

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          // Ask for JSON only, and keep answers steady rather than creative.
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") throw new AiTimeoutError();
    throw err;
  }

  if (!response.ok) {
    // Shown in the terminal / Vercel logs, never to the dealer. Never includes the key.
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Gemini returned ${response.status} for model ${model}: ${detail}`);
  }

  const data = await response.json();
  const reply: string = (data?.candidates?.[0]?.content?.parts ?? [])
    .filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
    .map((p: { text: string }) => p.text)
    .join("");

  // Some replies wrap the JSON in ```json fences; strip them before reading.
  const json = reply.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
  return AiAnswerSchema.parse(JSON.parse(json));
}
