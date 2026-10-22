// Checks billing maths, stock updates and translating results. Run with: npm test

import assert from "node:assert/strict";
import { test } from "node:test";
import { applyStock, billTotal, creditDue, nextBillNo, salesOn, type Bill } from "../lib/billing";
import { ProductSchema, SAMPLE_INVENTORY } from "../lib/inventory";
import { unsureBecause } from "../lib/rules";
import type { OkDiagnosis } from "../lib/schema";
import { TEXT } from "../lib/text";
import { translateResult } from "../lib/translate";

const bill = (over: Partial<Bill> = {}): Bill => ({
  id: "b1",
  no: 1,
  at: Date.now(),
  customerName: "",
  customerPhone: "",
  village: "",
  items: [
    { productId: "s1", name: "Mancozeb WP", unit: "", qty: 2, price: 320 },
    { productId: "s8", name: "Imidacloprid SL", unit: "", qty: 1, price: 380 },
  ],
  discount: 20,
  payment: "cash",
  paid: true,
  ...over,
});

test("bill total = qty × price − discount, never below zero", () => {
  assert.equal(billTotal(bill()), 2 * 320 + 380 - 20);
  assert.equal(billTotal(bill({ discount: 99999 })), 0);
});

test("saving a bill lowers stock; deleting puts it back", () => {
  const before = SAMPLE_INVENTORY.find((p) => p.id === "s1")!.qty;
  const after = applyStock(SAMPLE_INVENTORY, bill().items, -1);
  assert.equal(after.find((p) => p.id === "s1")!.qty, before - 2);
  const restored = applyStock(after, bill().items, 1);
  assert.equal(restored.find((p) => p.id === "s1")!.qty, before);
  assert.equal(applyStock(SAMPLE_INVENTORY, [{ productId: "s4", name: "x", unit: "", qty: 5, price: 1 }], -1).find((p) => p.id === "s4")!.qty, 0);
});

test("today's sales, credit due and bill numbers", () => {
  const yesterday = Date.now() - 86_400_000 * 2;
  const bills = [bill(), bill({ id: "b2", no: 7, payment: "credit", paid: false }), bill({ id: "b3", no: 3, at: yesterday })];
  const today = salesOn(bills, Date.now());
  assert.equal(today.count, 2);
  assert.equal(today.cash, billTotal(bill()));
  assert.equal(creditDue(bills).count, 1);
  assert.equal(nextBillNo(bills), 8);
});

test("old saved products (inStock yes/no) are upgraded to quantities", () => {
  const old = ProductSchema.parse({ id: "x", name: "Old", kind: "fungicide", inStock: true });
  assert.equal(old.qty, 10);
  assert.equal(ProductSchema.parse({ id: "y", name: "Old", kind: "fungicide", inStock: false }).qty, 0);
});

const okResult: OkDiagnosis = {
  status: "ok",
  crop: "cotton",
  lang: "en",
  causes: [{ name: "Whitefly", confidence: 0.85, level: "High", checks: ["Look under leaves"] }],
  treatmentType: "Insecticide for sucking pests",
  safetyNote: "Wear gloves.",
  labelLine: TEXT.en.labelLine,
  products: [{ id: "s8", name: "Imidacloprid SL", kind: "insecticide", ingredient: "", inStock: true, qty: 20, price: 380, unit: "", why: "Controls whitefly." }],
  shopChecked: true,
  warnings: [],
  demo: false,
};

test("translate: fixed lines use ready-made text, AI text is translated and re-checked", async () => {
  const sent: string[][] = [];
  const fake = async (texts: string[]) => {
    sent.push(texts);
    return texts.map((x) => (x === "Wear gloves." ? "हातमोजे घाला. 2 मिली प्रति लिटर वापरा." : `MR:${x}`));
  };
  const out = await translateResult(okResult, "mr", fake);
  assert.equal(out.lang, "mr");
  assert.equal(out.status, "ok");
  if (out.status !== "ok") return;
  assert.equal(out.labelLine, TEXT.mr.labelLine); // not sent to the AI
  assert.ok(!sent[0].includes(TEXT.en.labelLine));
  assert.equal(out.causes[0].name, "MR:Whitefly");
  assert.equal(out.safetyNote, "हातमोजे घाला."); // dose removed again after translation
  assert.equal(out.products[0].name, "Imidacloprid SL"); // product names unchanged
});

test("translate: Unsure steps swap to the other language without the AI", async () => {
  const unsure = unsureBecause(TEXT.en.unsureReasonBroken, "en", "onion", false);
  if (unsure.status !== "unsure") throw new Error("expected unsure");
  let called = false;
  const out = await translateResult(unsure, "hi", async (t) => ((called = true), t));
  assert.equal(called, false);
  assert.equal(out.status === "unsure" && out.reason, TEXT.hi.unsureReasonBroken);
  assert.deepEqual(out.status === "unsure" && out.nextSteps, TEXT.hi.unsureSteps);
});
