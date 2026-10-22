// Recent checks saved on this phone (no login, no server).

import { isLang, type Lang } from "./crops";
import { ResultSchema, type Result } from "./schema";

export type RecentCase = {
  id: string;
  at: number; // time of the check
  lang: Lang;
  result: Result;
};

export const MAX_RECENT = 10;

export function addRecent(cases: RecentCase[], result: Result): RecentCase[] {
  const entry: RecentCase = { id: `${Date.now()}`, at: Date.now(), lang: result.lang, result };
  return [entry, ...cases].slice(0, MAX_RECENT);
}

// Keeps only saved entries that still look right (older app versions saved
// slightly different data; those entries are skipped).
export function parseRecent(value: unknown): RecentCase[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((c) => {
    if (!c || typeof c.id !== "string" || typeof c.at !== "number" || !isLang(c.lang)) return [];
    const result = ResultSchema.safeParse({ lang: c.lang, ...c.result });
    return result.success ? [{ id: c.id, at: c.at, lang: c.lang, result: result.data }] : [];
  });
}
