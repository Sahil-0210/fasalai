"use client";

// The last 10 checks made on this phone. Tap one to see its full result again.
// Photos are not saved, only the result text.

import { useState } from "react";
import ResultCard from "@/components/ResultCard";
import UnsureCard from "@/components/UnsureCard";
import { CROPS, type Lang } from "@/lib/crops";
import type { RecentCase } from "@/lib/recent";
import { TEXT } from "@/lib/text";

type Props = { lang: Lang; cases: RecentCase[]; onClear: () => void };

export default function RecentView({ lang, cases, onClear }: Props) {
  const t = TEXT[lang];
  const [openId, setOpenId] = useState<string | null>(null);
  const open = cases.find((c) => c.id === openId);

  if (open) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setOpenId(null)} className="text-sm font-medium text-green-800 underline">
          {t.back}
        </button>
        {open.result.status === "ok" ? (
          <ResultCard result={open.result} lang={open.lang} />
        ) : (
          <UnsureCard result={open.result} lang={open.lang} />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-stone-900">🕘 {t.recentTitle}</h2>
          <p className="text-sm text-stone-500">{t.recentHint}</p>
        </div>
        {cases.length > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-red-700 underline">
            {t.clearRecent}
          </button>
        )}
      </div>

      {cases.length === 0 ? (
        <p className="mt-4 text-stone-500">{t.recentEmpty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-100">
          {cases.map((c) => {
            const crop = CROPS.find((x) => x.id === c.result.crop);
            const title = c.result.status === "ok" ? c.result.causes[0]?.name : `⚠ ${t.unsureShort}`;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className="flex w-full items-center gap-3 py-3 text-left hover:bg-stone-50"
                >
                  <span className="text-2xl" aria-hidden>
                    {crop?.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-stone-900">{title}</span>
                    <span className="block text-xs text-stone-500">
                      {crop?.[lang]} · {new Date(c.at).toLocaleString(lang === "en" ? "en-IN" : `${lang}-IN`, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </span>
                  <span className="text-stone-400" aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
