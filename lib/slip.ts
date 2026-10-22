// Builds the short WhatsApp message the dealer can send to the farmer.
// It opens WhatsApp with the text filled in; the dealer picks the contact
// and presses send themselves.

import { CROPS, cropName, type Lang } from "./crops";
import type { Diagnosis } from "./schema";
import { TEXT } from "./text";

export function buildSlip(result: Extract<Diagnosis, { status: "ok" }>, lang: Lang): string {
  const t = TEXT[lang];
  const top = result.causes[0];
  const lines = [
    `🌱 *${t.slipTitle}*`,
    `${CROPS.find((c) => c.id === result.crop)!.emoji} ${cropName(result.crop, lang)}`,
    "",
    `*${t.slipCause}:* ${top.name} (${t.confidence[top.level]})`,
  ];
  if (top.checks.length) {
    lines.push(`*${t.slipCheck}:*`, ...top.checks.map((c) => `• ${c}`));
  }
  const inStock = result.products.filter((p) => p.inStock);
  if (inStock.length) {
    lines.push("", `*${t.slipProducts}:*`, ...inStock.map((p) => `• ${p.name}`));
  }
  lines.push("", `⚠️ ${result.labelLine}`, `_${t.slipFooter}_`);
  return lines.join("\n");
}

export function whatsAppLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
