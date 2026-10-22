// The normal result: likely causes, what to check, treatment type, safety,
// matching products from the dealer's shop, and a WhatsApp slip for the farmer.

import { rupees } from "@/lib/format";
import type { ConfidenceLevel, OkDiagnosis, SuggestedProduct } from "@/lib/schema";
import type { Settings } from "@/lib/settings";
import { buildSlip, whatsAppLink } from "@/lib/slip";
import { TEXT } from "@/lib/text";

type Props = {
  result: OkDiagnosis;
  settings: Pick<Settings, "shopName" | "phone">;
  onAddToBill?: (product: SuggestedProduct) => void;
  inBill?: (productId: string) => boolean;
};

const LEVEL_STYLE: Record<ConfidenceLevel, { badge: string; bar: string }> = {
  High: { badge: "bg-green-100 text-green-800", bar: "bg-green-600" },
  Medium: { badge: "bg-amber-100 text-amber-800", bar: "bg-amber-500" },
  Low: { badge: "bg-stone-100 text-stone-600", bar: "bg-stone-400" },
};

export default function ResultCard({ result, settings, onAddToBill, inBill }: Props) {
  const t = TEXT[result.lang];

  return (
    <section className="space-y-4" aria-live="polite">
      {result.demo && (
        <p className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700">{t.demoMode}</p>
      )}

      {/* Likely causes */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-lg font-bold text-stone-900">{t.likelyCauses}</h2>
        <p className="mt-0.5 text-sm text-stone-500">{t.disclaimer}</p>

        <ol className="mt-3 space-y-3">
          {result.causes.map((cause, i) => {
            const style = LEVEL_STYLE[cause.level];
            return (
              <li
                key={i}
                className={`rounded-xl p-3 ${i === 0 ? "bg-green-50 ring-2 ring-green-600" : "bg-stone-50 ring-1 ring-stone-200"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-semibold text-stone-900 ${i === 0 ? "text-lg" : "text-base"}`}>
                    {i + 1}. {cause.name}
                  </h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
                    {t.confidence[cause.level]} · {Math.round(cause.confidence * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-stone-200" aria-hidden>
                  <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${Math.round(cause.confidence * 100)}%` }} />
                </div>
                {cause.checks.length > 0 && (
                  <>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">{t.checkToConfirm}</p>
                    <ul className="mt-1 space-y-1">
                      {cause.checks.map((check, j) => (
                        <li key={j} className="flex gap-2 text-sm text-stone-800">
                          <span aria-hidden className="text-green-700">☐</span>
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Treatment + safety */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">💊 {t.treatmentType}</h3>
          <p className="mt-1 text-stone-900">{result.treatmentType}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">🧤 {t.safetyNote}</h3>
          <p className="mt-1 text-stone-900">{result.safetyNote}</p>
        </div>
      </div>

      {/* From your shop */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-lg font-bold text-stone-900">🏪 {t.fromShop}</h2>
        {!result.shopChecked ? (
          <p className="mt-1 text-sm text-stone-600">{t.shopEmpty}</p>
        ) : result.products.length === 0 ? (
          <p className="mt-1 text-sm text-stone-600">{t.noShopMatch}</p>
        ) : (
          <>
            <p className="mt-0.5 text-sm text-stone-500">{t.fromShopHint}</p>
            <ul className="mt-3 space-y-2">
              {result.products.map((p) => (
                <li
                  key={p.id}
                  className={`rounded-xl p-3 ring-1 ${p.inStock ? "bg-white ring-stone-200" : "bg-stone-50 ring-stone-200 opacity-75"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-stone-900">{p.name}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.inStock ? `✓ ${t.inStock}` : t.outOfStock}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {t.kinds[p.kind]}
                    {p.ingredient && ` · ${p.ingredient}`}
                    {p.unit && ` · ${p.unit}`}
                  </p>
                  {p.why && <p className="mt-1 text-sm text-stone-700">{p.why}</p>}
                  {p.inStock && onAddToBill && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-800">{p.price > 0 ? rupees(p.price) : ""}</span>
                      {inBill?.(p.id) ? (
                        <span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-800">{t.addedToBill}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddToBill(p)}
                          className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-800"
                        >
                          {t.addToBill}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {result.warnings.map((w, i) => (
        <p key={i} className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
          ⚠ {w}
        </p>
      ))}

      <p className="rounded-xl border-2 border-orange-400 bg-orange-50 p-3 font-semibold text-orange-900">
        📋 {result.labelLine}
      </p>

      <a
        href={whatsAppLink(buildSlip(result, settings))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-base font-semibold text-white shadow-sm hover:brightness-95"
      >
        <span aria-hidden>💬</span> {t.shareWhatsApp}
      </a>
    </section>
  );
}
