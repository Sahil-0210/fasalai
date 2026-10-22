// The "Unsure, consult an expert" result. It never names a cause.

import type { Diagnosis } from "@/lib/schema";
import type { Strings } from "@/lib/text";

type Props = { result: Extract<Diagnosis, { status: "unsure" }>; t: Strings };

export default function UnsureCard({ result, t }: Props) {
  return (
    <section className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5" aria-live="polite">
      {result.demo && <p className="mb-3 text-xs font-medium text-purple-700">{t.demoMode}</p>}

      <h2 className="text-xl font-semibold text-amber-900">⚠ {t.unsureTitle}</h2>
      <p className="mt-2 text-amber-900">{t.unsureIntro}</p>
      <p className="mt-1 text-amber-900">{result.reason}</p>

      <h3 className="mt-4 font-medium text-amber-900">{t.whatNext}:</h3>
      <ul className="mt-1 space-y-1">
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
    </section>
  );
}
