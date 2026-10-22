// The normal result: likely causes, what to check, treatment type, safety.

import type { ConfidenceLevel, Diagnosis } from "@/lib/schema";
import type { Strings } from "@/lib/text";

type Props = { result: Extract<Diagnosis, { status: "ok" }>; t: Strings };

const BADGE: Record<ConfidenceLevel, string> = {
  High: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Low: "bg-gray-100 text-gray-700 border-gray-300",
};

export default function ResultCard({ result, t }: Props) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-live="polite">
      {result.demo && <p className="mb-3 text-xs font-medium text-purple-700">{t.demoMode}</p>}

      <h2 className="text-xl font-semibold text-gray-900">{t.likelyCauses}</h2>
      <p className="mt-1 text-sm text-gray-600">{t.disclaimer}</p>

      <ol className="mt-4 space-y-4">
        {result.causes.map((cause, i) => (
          <li key={i} className="rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {i + 1}. {cause.name}
              </h3>
              <span className={`rounded-full border px-3 py-0.5 text-sm font-medium ${BADGE[cause.level]}`}>
                {t.confidence[cause.level]} · {Math.round(cause.confidence * 100)}%
              </span>
            </div>
            {cause.checks.length > 0 && (
              <>
                <p className="mt-3 text-sm font-medium text-gray-700">{t.checkToConfirm}:</p>
                <ul className="mt-1 space-y-1">
                  {cause.checks.map((check, j) => (
                    <li key={j} className="flex gap-2 text-gray-800">
                      <span aria-hidden>☐</span>
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-5 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700">{t.treatmentType}</h3>
          <p className="text-gray-900">{result.treatmentType}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700">{t.safetyNote}</h3>
          <p className="text-gray-900">{result.safetyNote}</p>
        </div>
        {result.warnings.map((w, i) => (
          <p key={i} className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
            ⚠ {w}
          </p>
        ))}
        <p className="rounded-lg border-2 border-orange-400 bg-orange-50 p-3 font-semibold text-orange-900">
          📋 {result.labelLine}
        </p>
      </div>
    </section>
  );
}
