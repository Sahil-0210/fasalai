// Checks the safety rules with made-up AI answers. Run with: npm test

import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_INVENTORY, inventoryToCsv, parseInventoryCsv, type Product } from "../lib/inventory";
import { cleanText, decide, hasDose, shopForCrop } from "../lib/rules";
import type { AiAnswer } from "../lib/schema";

const shop: Product[] = [
  { id: "a", name: "Mancozeb WP", kind: "fungicide", ingredient: "Mancozeb", crops: [], inStock: true },
  { id: "b", name: "Azoxystrobin SC", kind: "fungicide", ingredient: "Azoxystrobin", crops: [], inStock: false },
  { id: "c", name: "Monocrotophos SL", kind: "insecticide", ingredient: "Monocrotophos", crops: [], inStock: true },
  { id: "d", name: "Grape-only fungicide", kind: "fungicide", ingredient: "Sulphur", crops: ["grapes"], inStock: true },
];

const goodAnswer: AiAnswer = {
  image_ok: true,
  causes: [
    { name: "Late blight", confidence: 0.4, checks: ["White growth under leaf"] },
    { name: "Early blight", confidence: 0.82, checks: ["Target-like rings", "Use 2 g per litre to test"] },
  ],
  treatment_type: "Fungicide. Spray 2 ml/L hexaconazole.",
  safety_note: "Wear gloves. Monocrotophos also works.",
  unsure_reason: "",
  products: [
    { id: "b", why: "Systemic fungicide for blight." },
    { id: "a", why: "Protective fungicide. Mix 2.5 g per litre." },
    { id: "c", why: "Kills insects." },
    { id: "made-up", why: "Not in the shop." },
  ],
};

const opts = (over: Partial<Parameters<typeof decide>[1]> = {}) => ({
  lang: "en" as const,
  crop: "tomato" as const,
  hasPhoto: true,
  demo: false,
  shop: shopForCrop(shop, "tomato"),
  shopChecked: true,
  ...over,
});

test("finds doses in English, Hindi and Marathi", () => {
  for (const s of ["spray 2 ml/L", "2.5 g per litre", "500 g/acre", "1-2 kg", "use 10% solution", "one bottle per acre", "2 मिली प्रति लीटर", "250 ग्राम", "2 मिली प्रति लिटर फवारा", "प्रति एकर 1 किलो"]) {
    assert.ok(hasDose(s), `should catch: ${s}`);
  }
});

test("does not flag normal sentences", () => {
  for (const s of ["Spots on 2 leaves", "spreading for 5 days", "Remove infected plants", "Wear gloves and a mask", "3 or 4 spots per leaf", "5 दिवसांपासून पसरत आहे"]) {
    assert.ok(!hasDose(s), `should keep: ${s}`);
  }
});

test("removes only the sentence with the dose", () => {
  const r = cleanText("Use a fungicide. Spray 2.5 ml per litre. Remove sick leaves.");
  assert.equal(r.text, "Use a fungicide. Remove sick leaves.");
});

test("normal result: sorted causes, no doses, no banned names, label line added", () => {
  const d = decide(goodAnswer, opts());
  assert.equal(d.status, "ok");
  if (d.status !== "ok") return;
  assert.equal(d.causes[0].name, "Early blight");
  assert.equal(d.causes[0].level, "High");
  assert.deepEqual(d.causes[0].checks, ["Target-like rings"]);
  assert.equal(d.treatmentType, "Fungicide.");
  assert.equal(d.safetyNote, "Wear gloves.");
  assert.match(d.labelLine, /Read the label for dose/);
  assert.equal(d.warnings.length, 1);
  const everything = JSON.stringify(d);
  assert.ok(!/\d\s*(ml|g)\b/i.test(everything) && !/monocrotophos/i.test(everything));
});

test("shop: only real, non-banned products for this crop; in stock first; no doses", () => {
  const d = decide(goodAnswer, opts());
  assert.equal(d.status, "ok");
  if (d.status !== "ok") return;
  assert.deepEqual(d.products.map((p) => p.id), ["a", "b"]); // c banned, made-up dropped, a in stock first
  assert.equal(d.products[0].why, "Protective fungicide.");
});

test("shop: crop-limited products only for that crop", () => {
  assert.ok(!shopForCrop(shop, "tomato").some((p) => p.id === "d"));
  assert.ok(shopForCrop(shop, "grapes").some((p) => p.id === "d"));
  assert.ok(!shopForCrop(SAMPLE_INVENTORY, "cotton").some((p) => /monocrotophos/i.test(p.name)));
});

test("bad photo -> unsure, with no cause names or products", () => {
  const d = decide({ ...goodAnswer, image_ok: false }, opts());
  assert.equal(d.status, "unsure");
  const json = JSON.stringify(d);
  assert.ok(!json.includes("blight") && !json.includes("Mancozeb"));
});

test("low confidence -> unsure", () => {
  const low = { ...goodAnswer, causes: [{ name: "Something", confidence: 0.45, checks: [] }] };
  assert.equal(decide(low, opts({ hasPhoto: false })).status, "unsure");
});

test("no causes -> unsure; text-only answers ignore image_ok", () => {
  assert.equal(decide({ ...goodAnswer, causes: [] }, opts({ hasPhoto: false })).status, "unsure");
  assert.equal(decide({ ...goodAnswer, image_ok: false }, opts({ hasPhoto: false })).status, "ok");
});

test("Marathi label line and Marathi dose removal", () => {
  const mr: AiAnswer = { ...goodAnswer, treatment_type: "बुरशीनाशक. मॅन्कोझेब 2.5 ग्रॅम प्रति लिटर फवारा." };
  const d = decide(mr, opts({ lang: "mr" }));
  assert.equal(d.status, "ok");
  if (d.status !== "ok") return;
  assert.equal(d.treatmentType, "बुरशीनाशक.");
  assert.match(d.labelLine, /लेबल/);
});

test("CSV: reads Excel-style files and round-trips", () => {
  const csv = '﻿Product Name,Type,Active Ingredient,Crops,Stock\r\n"Copper, oxychloride",Fungicide,Copper,Grapes;cotton,0\r\nNeem oil,bio,,,12\r\n,,,\r\n';
  const parsed = parseInventoryCsv(csv);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, "Copper, oxychloride");
  assert.equal(parsed[0].kind, "fungicide");
  assert.deepEqual(parsed[0].crops, ["cotton", "grapes"]);
  assert.equal(parsed[0].inStock, false);
  assert.equal(parsed[1].kind, "bio");
  assert.equal(parsed[1].inStock, true);
  const withoutIds = (list: Product[]) => list.map((p) => ({ ...p, id: "" }));
  const again = parseInventoryCsv(inventoryToCsv(parsed));
  assert.deepEqual(withoutIds(again), withoutIds(parsed));
});

test("CSV: a file without a name column is rejected", () => {
  assert.throws(() => parseInventoryCsv("type,stock\nfungicide,yes"));
});
