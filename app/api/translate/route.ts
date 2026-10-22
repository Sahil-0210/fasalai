// Translates a result already on screen into another language
// (used when the dealer changes the language after a check).

import { isLang } from "@/lib/crops";
import { AiTimeoutError, translateTexts } from "@/lib/openrouter";
import { ResultSchema } from "@/lib/schema";
import { translateResult } from "@/lib/translate";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ResultSchema.safeParse(body?.result);
  const lang = body?.lang;
  if (!parsed.success || !isLang(lang)) return Response.json({ ok: false }, { status: 400 });

  const apiKey = process.env.OPENROUTER_API_KEY;
  try {
    // Demo mode: no AI to translate with, so only the fixed lines change.
    const from = parsed.data.lang;
    const translate = apiKey ? (texts: string[]) => translateTexts(apiKey, texts, from, lang) : async (texts: string[]) => texts;
    const result = await translateResult(parsed.data, lang, translate);
    return Response.json({ ok: true, result });
  } catch (err) {
    console.error("[translate]", err);
    return Response.json({ ok: false, timeout: err instanceof AiTimeoutError }, { status: 502 });
  }
}
