// The "Unsure, consult an expert" result. It never names a cause or a product.

import type { Lang } from "@/lib/crops";
import type { Diagnosis } from "@/lib/schema";
import { TEXT } from "@/lib/text";

type Props = { result: Extract<Diagnosis, { status: "unsure" }>; lang: Lang };

export default function UnsureCard({ result, lang }: Props) {
  const t = TEXT[lang];

  return (
    <section className="rounded-2xl bg-amber-50 p-4 ring-2 ring-amber-400" aria-live="polite">
      {result.demo && <p className="mb-3 text-xs font-medium text-purple-700">{t.demoMode}</p>}

      <h2 className="text-lg font-bold text-amber-900">⚠ {t.unsureTitle}</h2>
      <p className="mt-1 text-amber-900">{t.unsureIntro}</p>
      <p className="mt-1 text-amber-900">{result.reason}</p>

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-800">{t.whatNext}</h3>
      <ul className="mt-1 space-y-1.5">
        {result.nextSteps.map((step, i) => (
          <li key={i} className="flex gap-2 text-amber-950">
            <span aria-hidden>→</span>
            <span>{step}</span>
          </li>
        ))}
      </ul>

      {result.warnings.map((w, i) => (
        <p key={i} className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          ⚠ {w}
        </p>
      ))}

      <a
        href="tel:18001801551"
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700"
      >
        {t.callKisan}
      </a>
    </section>
  );
}
