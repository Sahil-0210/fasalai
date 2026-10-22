# 🌱 FasalAI

A one-screen helper for agri-input dealers in India. The dealer picks a crop and
language, adds a leaf photo and/or the farmer's description (typed or spoken),
and gets **likely causes with confidence levels and a "check this to confirm"
list**: never a single verdict, never a dose.

If the photo is bad or the AI isn't confident, it says **"Unsure, consult an
expert"** instead of guessing.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

With no API key, the app runs in **demo mode** (sample answers, clearly
labelled). Type "blurry" in the description to see the Unsure card.

## Add the AI key (Google Gemini)

1. Get a key at https://aistudio.google.com/apikey.
2. Copy `.env.example` to `.env.local`.
3. Paste your key after `GEMINI_API_KEY=`.
4. Restart `npm run dev`.

`.env.local` is ignored by git, so the key is never uploaded. On Vercel, add the
same variable under Project → Settings → Environment Variables.

## How it works

| Part | File | AI or plain code? |
|---|---|---|
| The screen | `app/page.tsx`, `components/` | Plain code |
| Crop and language lists | `lib/crops.ts` | Plain code (edit this to change crops) |
| Server route | `app/api/diagnose/route.ts` | Checks input, then calls the AI once per tap |
| Gemini call | `lib/gemini.ts` | The only file that talks to the AI |
| What the AI is asked | `lib/prompt.ts` | Instructions for the AI |
| Safety rules | `lib/rules.ts`, `lib/banned.ts` | Plain code: unsure gate (top confidence below 60%), dose stripper, banned-pesticide block, "Read the label" line |
| Demo answers | `lib/demo.ts` | Plain code |

Check the safety rules with:

```bash
npm test
```

## Out of scope (by design)

- Logins and history
- Exact dosages: never, by design
- More than 4 crops
- Fertiliser advice
- Multi-turn follow-up questions
- n8n logging

Later (v2): follow-up questions, more crops and languages, product-registration
checks, dealer analytics, expert hand-off.
