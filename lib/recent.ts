// Recent checks saved on this phone (no login, no server).

import { isLang, type Lang } from "./crops";
import type { Diagnosis } from "./schema";

export type RecentCase = {
  id: string;
  at: number; // time of the check
  lang: Lang;
  result: Extract<Diagnosis, { status: "ok" | "unsure" }>;
};

export const MAX_RECENT = 10;

export function addRecent(cases: RecentCase[], result: RecentCase["result"], lang: Lang): RecentCase[] {
  const entry: RecentCase = { id: `${Date.now()}`, at: Date.now(), lang, result };
  return [entry, ...cases].slice(0, MAX_RECENT);
}

// Checks saved data still looks right (it may come from an older version of the app).
export function parseRecent(value: unknown): RecentCase[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (c): c is RecentCase =>
      c &&
      typeof c.id === "string" &&
      typeof c.at === "number" &&
      isLang(c.lang) &&
      (c.result?.status === "ok" || c.result?.status === "unsure") &&
      typeof c.result.crop === "string",
  );
}
