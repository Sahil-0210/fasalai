// Builds the short WhatsApp message the dealer can send to the farmer.
// It opens WhatsApp with the text filled in; the dealer picks the contact
// and presses send themselves.

import { CROPS, cropName } from "./crops";
import type { OkDiagnosis } from "./schema";
import type { Settings } from "./settings";
import { TEXT } from "./text";

export function buildSlip(result: OkDiagnosis, settings: Pick<Settings, "shopName" | "phone">): string {
  const lang = result.lang;
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
  const shop = [settings.shopName, settings.phone].filter(Boolean).join(" · ");
  if (shop) lines.push("", `🏪 ${shop}`);
  return lines.join("\n");
}

// Opens WhatsApp with the text ready. With a 10-digit Indian number, it opens
// that person's chat; otherwise the dealer picks the contact.
export function whatsAppLink(text: string, phone = ""): string {
  const digits = phone.replace(/\D/g, "");
  const to = digits.length === 10 ? `91${digits}` : digits.length === 12 && digits.startsWith("91") ? digits : "";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}
