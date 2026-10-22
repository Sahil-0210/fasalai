// Changes a result shown on screen into another language.
// Fixed lines ("Read the label for dose", the Unsure steps...) are swapped for
// the ready-made translations in text.ts. Only the AI-written text is sent for
// translation, and the safety rules run again on what comes back.

import type { Lang } from "./crops";
import { cleanText } from "./rules";
import type { Result } from "./schema";
import { TEXT, type Strings } from "./text";

type Translate = (texts: string[]) => Promise<string[]>;

// Fixed lines that may appear in a result, by their key in text.ts.
const FIXED_KEYS = [
  "labelLine",
  "bannedWarning",
  "treatmentFallback",
  "safetyFallback",
  "unsureReasonDefault",
  "unsureReasonTimeout",
  "unsureReasonBroken",
] as const satisfies (keyof Strings)[];

export async function translateResult(result: Result, to: Lang, translate: Translate): Promise<Result> {
  if (result.lang === to) return result;
  const from = TEXT[result.lang];
  const dest = TEXT[to];

  // Each text either has a ready-made translation, or is queued for the AI.
  const queue: string[] = [];
  const slots: Array<{ fixed: string } | { index: number }> = [];
  const add = (text: string) => {
    const key = FIXED_KEYS.find((k) => from[k] === text);
    const step = from.unsureSteps.indexOf(text);
    if (key) slots.push({ fixed: dest[key] });
    else if (step >= 0) slots.push({ fixed: dest.unsureSteps[step] });
    else if (!text.trim()) slots.push({ fixed: text });
    else slots.push({ index: queue.push(text) - 1 });
    return slots.length - 1;
  };

  // Two passes: first register every text (so the AI gets one list), then
  // translate the list once, then build the new result from it.
  const translateAll = async () => (queue.length ? await translate(queue) : []);
  let removedBanned = false;
  const reader = (translated: string[]) => (id: number) => {
    const slot = slots[id];
    if ("fixed" in slot) return slot.fixed;
    const clean = cleanText(translated[slot.index] ?? "");
    removedBanned ||= clean.removedBanned;
    return clean.text;
  };
  const withBanWarning = (warnings: string[]) =>
    removedBanned && !warnings.includes(dest.bannedWarning) ? [...warnings, dest.bannedWarning] : warnings;

  if (result.status === "ok") {
    const causeIds = result.causes.map((c) => ({ name: add(c.name), checks: c.checks.map(add) }));
    const treatmentId = add(result.treatmentType);
    const safetyId = add(result.safetyNote);
    const whyIds = result.products.map((p) => add(p.why));
    const warningIds = result.warnings.map(add);
    const read = reader(await translateAll());
    const causes = result.causes.map((c, i) => ({
      ...c,
      name: read(causeIds[i].name) || c.name,
      checks: causeIds[i].checks.map(read).filter(Boolean),
    }));
    return {
      ...result,
      lang: to,
      causes,
      treatmentType: read(treatmentId) || dest.treatmentFallback,
      safetyNote: read(safetyId) || dest.safetyFallback,
      labelLine: dest.labelLine,
      products: result.products.map((p, i) => ({ ...p, why: read(whyIds[i]) })),
      warnings: withBanWarning(warningIds.map(read)),
    };
  }

  const reasonId = add(result.reason);
  const stepIds = result.nextSteps.map(add);
  const warningIds = result.warnings.map(add);
  const read = reader(await translateAll());
  return {
    ...result,
    lang: to,
    reason: read(reasonId) || dest.unsureReasonDefault,
    nextSteps: stepIds.map(read).filter(Boolean),
    warnings: withBanWarning(warningIds.map(read)),
  };
}
