// Formatting money and dates the Indian way (₹1,25,000).

import type { Lang } from "./crops";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function rupees(amount: number): string {
  return money.format(amount);
}

export function locale(lang: Lang): string {
  return lang === "en" ? "en-IN" : `${lang}-IN`;
}

export function dateTime(at: number, lang: Lang): string {
  return new Date(at).toLocaleString(locale(lang), { dateStyle: "medium", timeStyle: "short" });
}
