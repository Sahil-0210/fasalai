// Checks the safety rules with made-up AI answers. Run with: npm test

import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanText, decide, hasDose } from "../lib/rules";
import type { AiAnswer } from "../lib/schema";

const goodAnswer: AiAnswer = {
  image_ok: true,
  causes: [
    { name: "Late blight", confidence: 0.4, checks: ["White growth under leaf"] },
    { name: "Early blight", confidence: 0.82, checks: ["Target-like rings", "Use 2 g per litre to test"] },
  ],
  treatment_type: "Fungicide. Spray 2 ml/L hexaconazole.",
  safety_note: "Wear gloves. Monocrotophos also works.",
  unsure_reason: "",
};

test("finds doses in English and Hindi", () => {
  for (const s of ["spray 2 ml/L", "2.5 g per litre", "500 g/acre", "1-2 kg", "use 10% solution", "one bottle per acre", "2 मिली प्रति लीटर", "250 ग्राम"]) {
    assert.ok(hasDose(s), `should catch: ${s}`);
  }
});

test("does not flag normal sentences", () => {
  for (const s of ["Spots on 2 leaves", "spreading for 5 days", "Remove infected plants", "Wear gloves and a mask", "3 or 4 spots per leaf"]) {
    assert.ok(!hasDose(s), `should keep: ${s}`);
  }
});

test("removes only the sentence with the dose", () => {
  const r = cleanText("Use a fungicide. Spray 2.5 ml per litre. Remove sick leaves.");
  assert.equal(r.text, "Use a fungicide. Remove sick leaves.");
});

test("normal result: sorted causes, no doses, no banned names, label line added", () => {
  const d = decide(goodAnswer, { lang: "en", hasPhoto: true, demo: false });
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

test("bad photo -> unsure, with no cause names", () => {
  const d = decide({ ...goodAnswer, image_ok: false }, { lang: "en", hasPhoto: true, demo: false });
  assert.equal(d.status, "unsure");
  assert.ok(!JSON.stringify(d).includes("blight"));
});

test("low confidence -> unsure", () => {
  const low = { ...goodAnswer, causes: [{ name: "Something", confidence: 0.45, checks: [] }] };
  assert.equal(decide(low, { lang: "en", hasPhoto: false, demo: false }).status, "unsure");
});

test("no causes -> unsure; text-only answers ignore image_ok", () => {
  assert.equal(decide({ ...goodAnswer, causes: [] }, { lang: "en", hasPhoto: false, demo: false }).status, "unsure");
  assert.equal(decide({ ...goodAnswer, image_ok: false }, { lang: "en", hasPhoto: false, demo: false }).status, "ok");
});

test("Hindi label line and Hindi dose removal", () => {
  const hi: AiAnswer = { ...goodAnswer, treatment_type: "फफूंदनाशक। मैंकोज़ेब 2.5 ग्राम प्रति लीटर छिड़कें।" };
  const d = decide(hi, { lang: "hi", hasPhoto: true, demo: false });
  assert.equal(d.status, "ok");
  if (d.status !== "ok") return;
  assert.equal(d.treatmentType, "फफूंदनाशक।");
  assert.match(d.labelLine, /लेबल/);
});
