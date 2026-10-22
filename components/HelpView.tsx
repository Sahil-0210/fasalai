// ❓ Help: emergency numbers, expert help, how-to guides and common questions.

import { CROPS, type Lang } from "@/lib/crops";
import { CROP_PHOTOS } from "@/lib/cropPhotos";
import { KISAN_CALL_CENTRE, KVK_DIRECTORY_URL, SUPPORT } from "@/lib/support";
import { TEXT } from "@/lib/text";

export default function HelpView({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const hasTeamContact = SUPPORT.whatsapp || SUPPORT.email;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">❓ {t.helpTitle}</h1>
        <p className="text-stone-600">{t.helpIntro}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
            <p className="font-semibold text-red-900">{t.emergency}</p>
            <a href="tel:108" className="mt-2 inline-block rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700">
              📞 {t.callEmergency}
            </a>
          </div>

          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <a
              href={`tel:${KISAN_CALL_CENTRE}`}
              className="flex w-full items-center justify-center rounded-xl bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800"
            >
              {t.callKisan}
            </a>
            <a
              href={KVK_DIRECTORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl px-4 py-3 text-center font-medium text-green-800 ring-1 ring-green-700 hover:bg-green-50"
            >
              {t.kvkLink}
            </a>
            {hasTeamContact && (
              <a
                href={SUPPORT.whatsapp ? `https://wa.me/${SUPPORT.whatsapp}` : `mailto:${SUPPORT.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl px-4 py-3 text-center font-medium text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50"
              >
                💬 {t.contactTeam}
              </a>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h2 className="mb-2 text-lg font-bold text-stone-900">{t.guidesTitle}</h2>
            <ol className="space-y-3">
              {t.guides.map((g, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-stone-900">{g.q}</span>
                    <span className="block text-sm text-stone-600">{g.a}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 lg:self-start">
          <h2 className="mb-2 text-lg font-bold text-stone-900">{t.faqTitle}</h2>
          <div className="divide-y divide-stone-100">
            {t.faqs.map((f, i) => (
              <details key={i} className="group py-3">
                <summary className="cursor-pointer list-none font-semibold text-stone-900">
                  <span className="mr-2 inline-block text-green-700 transition group-open:rotate-90">›</span>
                  {f.q}
                </summary>
                <p className="mt-1 pl-5 text-sm text-stone-600">{f.a}</p>
              </details>
            ))}
            <details className="group py-3">
              <summary className="cursor-pointer list-none font-semibold text-stone-900">
                <span className="mr-2 inline-block text-green-700 transition group-open:rotate-90">›</span>
                📷 {t.photoCredits}
              </summary>
              <p className="mt-1 pl-5 text-sm text-stone-600">{t.photoCreditsIntro}</p>
              <ul className="mt-2 space-y-1 pl-5 text-xs text-stone-600">
                {CROPS.map((c) => (
                  <li key={c.id}>
                    <a href={CROP_PHOTOS[c.id].source} target="_blank" rel="noopener noreferrer" className="font-medium text-green-800 underline">
                      {c[lang]}
                    </a>
                    {" — "}
                    {CROP_PHOTOS[c.id].author}, {CROP_PHOTOS[c.id].license}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
