// The dealer's product list ("My Shop"): its shape, a sample list, and
// reading/writing CSV files (Excel can save any sheet as CSV).

import { z } from "zod";
import { CROPS, type CropId } from "./crops";
import { hasBanned } from "./rules";

export const PRODUCT_KINDS = ["fungicide", "insecticide", "herbicide", "fertiliser", "bio", "other"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const ProductSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  kind: z.enum(PRODUCT_KINDS),
  ingredient: z.string().trim().max(120).default(""),
  // Empty list = not limited to particular crops (still check the label).
  crops: z.array(z.string()).max(CROPS.length).default([]),
  inStock: z.boolean().default(true),
});

export type Product = z.infer<typeof ProductSchema>;

export const InventorySchema = z.array(ProductSchema).max(300);

export const MAX_PRODUCTS = 300;

// A typical Maharashtra agri-input shop, used until the dealer adds their own.
// Generic names only. Monocrotophos is included on purpose to show that
// banned products are flagged and never suggested.
const SAMPLE: Omit<Product, "id">[] = [
  { name: "Mancozeb WP", kind: "fungicide", ingredient: "Mancozeb", crops: [], inStock: true },
  { name: "Copper oxychloride WP", kind: "fungicide", ingredient: "Copper oxychloride", crops: [], inStock: true },
  { name: "Hexaconazole SC", kind: "fungicide", ingredient: "Hexaconazole", crops: [], inStock: true },
  { name: "Azoxystrobin + Difenoconazole SC", kind: "fungicide", ingredient: "Azoxystrobin, Difenoconazole", crops: [], inStock: false },
  { name: "Metalaxyl + Mancozeb WP", kind: "fungicide", ingredient: "Metalaxyl, Mancozeb", crops: [], inStock: true },
  { name: "Wettable sulphur WDG", kind: "fungicide", ingredient: "Sulphur", crops: [], inStock: true },
  { name: "Carbendazim WP", kind: "fungicide", ingredient: "Carbendazim", crops: [], inStock: true },
  { name: "Imidacloprid SL", kind: "insecticide", ingredient: "Imidacloprid", crops: [], inStock: true },
  { name: "Thiamethoxam WG", kind: "insecticide", ingredient: "Thiamethoxam", crops: [], inStock: true },
  { name: "Emamectin benzoate SG", kind: "insecticide", ingredient: "Emamectin benzoate", crops: [], inStock: true },
  { name: "Chlorantraniliprole SC", kind: "insecticide", ingredient: "Chlorantraniliprole", crops: [], inStock: true },
  { name: "Fipronil SC", kind: "insecticide", ingredient: "Fipronil", crops: [], inStock: true },
  { name: "Spinosad SC", kind: "insecticide", ingredient: "Spinosad", crops: [], inStock: false },
  { name: "Spiromesifen SC", kind: "insecticide", ingredient: "Spiromesifen (for mites)", crops: [], inStock: true },
  { name: "Monocrotophos SL", kind: "insecticide", ingredient: "Monocrotophos", crops: [], inStock: true },
  { name: "Neem oil (Azadirachtin)", kind: "bio", ingredient: "Azadirachtin", crops: [], inStock: true },
  { name: "Trichoderma viride", kind: "bio", ingredient: "Trichoderma viride (soil-borne fungi)", crops: [], inStock: true },
  { name: "Pseudomonas fluorescens", kind: "bio", ingredient: "Pseudomonas fluorescens", crops: [], inStock: true },
  { name: "Streptocycline", kind: "other", ingredient: "Streptomycin + Tetracycline (bacterial diseases)", crops: [], inStock: true },
  { name: "Zinc sulphate", kind: "fertiliser", ingredient: "Zinc", crops: [], inStock: true },
  { name: "Ferrous sulphate", kind: "fertiliser", ingredient: "Iron", crops: [], inStock: true },
  { name: "Magnesium sulphate", kind: "fertiliser", ingredient: "Magnesium", crops: [], inStock: true },
  { name: "Boron (disodium octaborate)", kind: "fertiliser", ingredient: "Boron", crops: [], inStock: false },
  { name: "NPK 19:19:19 water soluble", kind: "fertiliser", ingredient: "Nitrogen, Phosphorus, Potassium", crops: [], inStock: true },
  { name: "Glyphosate SL", kind: "herbicide", ingredient: "Glyphosate", crops: [], inStock: true },
];

export const SAMPLE_INVENTORY: Product[] = SAMPLE.map((p, i) => ({ ...p, id: `s${i + 1}` }));

export function newProductId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function isBannedProduct(p: Pick<Product, "name" | "ingredient">): boolean {
  return hasBanned(`${p.name} ${p.ingredient}`);
}

// --- CSV --------------------------------------------------------------------

export const CSV_HEADER = ["name", "type", "active_ingredient", "crops", "in_stock"];

export const CSV_TEMPLATE = [
  CSV_HEADER.join(","),
  "Mancozeb WP,fungicide,Mancozeb,,yes",
  "Imidacloprid SL,insecticide,Imidacloprid,cotton;soybean,yes",
  "Zinc sulphate,fertiliser,Zinc,,no",
].join("\n");

// Splits CSV text into rows of cells. Handles "quoted, cells" and "" escapes.
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, ""); // Excel adds an invisible mark at the start
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
}

const KIND_WORDS: Record<string, ProductKind> = {
  fungicide: "fungicide",
  insecticide: "insecticide",
  pesticide: "insecticide",
  acaricide: "insecticide",
  miticide: "insecticide",
  herbicide: "herbicide",
  weedicide: "herbicide",
  fertiliser: "fertiliser",
  fertilizer: "fertiliser",
  micronutrient: "fertiliser",
  nutrient: "fertiliser",
  bio: "bio",
  biological: "bio",
  "bio-pesticide": "bio",
  biopesticide: "bio",
  organic: "bio",
};

function toKind(value: string): ProductKind {
  return KIND_WORDS[value.toLowerCase()] ?? "other";
}

function toCrops(value: string): CropId[] {
  const wanted = value.toLowerCase().split(/[;|/]/).map((s) => s.trim()).filter(Boolean);
  return CROPS.filter((c) =>
    wanted.some((w) => w === c.id || c.en.toLowerCase().startsWith(w) || w === c.mr || w === c.hi),
  ).map((c) => c.id);
}

function toInStock(value: string): boolean {
  const v = value.toLowerCase();
  if (!v) return true;
  if (["no", "n", "false", "0", "नाही", "नहीं"].includes(v)) return false;
  const n = Number(v);
  return Number.isNaN(n) ? true : n > 0;
}

// Reads a CSV file into products. Rows without a name are skipped.
// Column names can be in any order; only "name" is required.
export function parseInventoryCsv(text: string): Product[] {
  const [header, ...rows] = parseCsvRows(text);
  if (!header) return [];
  const col = (names: string[]) => header.findIndex((h) => names.includes(h.toLowerCase().replace(/\s+/g, "_")));
  const iName = col(["name", "product", "product_name"]);
  if (iName < 0) throw new Error("No 'name' column");
  const iType = col(["type", "kind", "category"]);
  const iIngredient = col(["active_ingredient", "ingredient", "technical", "content"]);
  const iCrops = col(["crops", "crop"]);
  const iStock = col(["in_stock", "stock", "quantity", "qty"]);
  const get = (row: string[], i: number) => (i >= 0 ? (row[i] ?? "") : "");

  return rows
    .filter((row) => get(row, iName))
    .slice(0, MAX_PRODUCTS)
    .map((row) => ({
      id: newProductId(),
      name: get(row, iName).slice(0, 80),
      kind: toKind(get(row, iType)),
      ingredient: get(row, iIngredient).slice(0, 120),
      crops: toCrops(get(row, iCrops)),
      inStock: toInStock(get(row, iStock)),
    }));
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function inventoryToCsv(products: Product[]): string {
  const lines = products.map((p) =>
    [p.name, p.kind, p.ingredient, p.crops.join(";"), p.inStock ? "yes" : "no"].map(csvCell).join(","),
  );
  return [CSV_HEADER.join(","), ...lines].join("\n");
}
