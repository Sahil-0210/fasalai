# 🌱 FasalAI

A helper for agri-input dealers (krushi seva kendras) in Maharashtra. The dealer
picks one of 14 major Maharashtra crops, adds a leaf photo and/or the farmer's
description (typed or spoken, in Marathi, Hindi or English), and gets **likely
causes with confidence levels, a "check this to confirm" list, and matching
products from their own shop**: never a single verdict, never a dose.

Three tabs:
- **🩺 Check crop:** crop → stage (optional) → photo/description → result,
  with a one-tap WhatsApp slip for the farmer.
- **🏪 My Shop:** the dealer's product list. Upload a CSV from Excel, or add
  and edit products. FasalAI only suggests from this list, never banned products.
- **🕘 Recent:** the last 10 checks on this phone.

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

## Add the AI key (OpenRouter)

The AI runs through [OpenRouter](https://openrouter.ai), using Google Gemini 3.8 Flash by default.

1. Get a key at https://openrouter.ai/keys.
2. Copy `.env.example` to `.env.local`.
3. Paste your key after `OPENROUTER_API_KEY=`.
4. Restart `npm run dev`.

To try another model, set `OPENROUTER_MODEL` in `.env.local`, e.g. `google/gemini-3.5-flash-lite`.

`.env.local` is ignored by git, so the key is never uploaded. On Vercel, add the
same variable under Project → Settings → Environment Variables.

## How it works

| Part | File | AI or plain code? |
|---|---|---|
| The screen | `app/page.tsx`, `components/` | Plain code |
| Crops, stages, languages | `lib/crops.ts` | Plain code (edit this to change crops) |
| Screen text (मराठी / हिंदी / English) | `lib/text.ts` | Plain code |
| Shop list, sample list, CSV | `lib/inventory.ts` | Plain code |
| WhatsApp slip | `lib/slip.ts` | Plain code |
| Server route | `app/api/diagnose/route.ts` | Checks input, then calls the AI once per tap |
| AI call | `lib/openrouter.ts` | The only file that talks to the AI |
| What the AI is asked | `lib/prompt.ts` | Instructions for the AI |
| Safety rules | `lib/rules.ts`, `lib/banned.ts` | Plain code: unsure gate (top confidence below 60%), dose stripper (English, Hindi, Marathi), banned-pesticide block, products only from the shop list, "Read the label" line |
| Demo answers | `lib/demo.ts` | Plain code |

Check the safety rules with:

```bash
npm test
```

## Shop list CSV format

Columns (any order, only `name` is required):
`name, type, active_ingredient, crops, in_stock`

- `type`: fungicide, insecticide, herbicide, fertiliser, bio or other
- `crops`: crop names separated by `;` (empty = all crops)
- `in_stock`: yes/no, or a quantity (0 = out of stock)

The shop list and recent checks are saved in the browser on that phone only.

## Out of scope (by design)

- Logins, and syncing the shop list across phones
- Exact dosages: never, by design
- Multi-turn follow-up questions
- n8n logging

Later (v2): follow-up questions, product-registration checks against the
official CIB&RC list, dealer analytics, expert hand-off.
