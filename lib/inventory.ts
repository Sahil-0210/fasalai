// The dealer's product list ("My Shop"): its shape, a sample list, and
// reading/writing CSV files (Excel can save any sheet as CSV).

import { z } from "zod";
import { CROPS, type CropId } from "./crops";
import { hasBanned } from "./rules";

export const PRODUCT_KINDS = ["fungicide", "insecticide", "herbicide", "fertiliser", "bio", "other"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

// Lists saved by the earlier version had "inStock: true/false" instead of a
// quantity. Turn those into a quantity so nothing is lost.
function upgradeOld(value: unknown): unknown {
  if (value && typeof value === "object" && !("qty" in value) && "inStock" in value) {
    const { inStock, ...rest } = value as Record<string, unknown>;
    return { ...rest, qty: inStock ? 10 : 0 };
  }
  return value;
}

export const ProductSchema = z.preprocess(
  upgradeOld,
  z.object({
    id: z.string().min(1).max(40),
    name: z.string().trim().min(1).max(80),
    kind: z.enum(PRODUCT_KINDS),
    ingredient: z.string().trim().max(120).default(""),
    // Empty list = not limited to particular crops (still check the label).
    crops: z.array(z.string()).max(CROPS.length).default([]),
    qty: z.number().int().min(0).max(1_000_000).default(0), // units in stock
    price: z.number().min(0).max(10_000_000).default(0), // ₹ per unit
    unit: z.string().trim().max(30).default(""), // pack size, e.g. "500 g pack"
  }),
);

export type Product = z.infer<typeof ProductSchema>;

export function inStock(p: Pick<Product, "qty">): boolean {
  return p.qty > 0;
}

export const InventorySchema = z.array(ProductSchema).max(300);

export const MAX_PRODUCTS = 300;

// A typical Maharashtra agri-input shop, used until the dealer adds their own.
// Generic names only; prices are rough examples. Monocrotophos is included on purpose to show that
// banned products are flagged and never suggested.
type SampleRow = [string, ProductKind, string, string, number, number]; // name, kind, ingredient, unit, ₹, qty
const SAMPLE_ROWS: SampleRow[] = [
  ["Mancozeb WP", "fungicide", "Mancozeb", "500 g pack", 320, 24],
  ["Copper oxychloride WP", "fungicide", "Copper oxychloride", "500 g pack", 380, 15],
  ["Hexaconazole SC", "fungicide", "Hexaconazole", "1 L bottle", 650, 12],
  ["Azoxystrobin + Difenoconazole SC", "fungicide", "Azoxystrobin, Difenoconazole", "200 ml bottle", 1150, 0],
  ["Metalaxyl + Mancozeb WP", "fungicide", "Metalaxyl, Mancozeb", "500 g pack", 520, 10],
  ["Wettable sulphur WDG", "fungicide", "Sulphur", "1 kg pack", 180, 30],
  ["Carbendazim WP", "fungicide", "Carbendazim", "500 g pack", 290, 18],
  ["Imidacloprid SL", "insecticide", "Imidacloprid", "250 ml bottle", 380, 20],
  ["Thiamethoxam WG", "insecticide", "Thiamethoxam", "100 g pack", 290, 25],
  ["Emamectin benzoate SG", "insecticide", "Emamectin benzoate", "100 g pack", 420, 14],
  ["Chlorantraniliprole SC", "insecticide", "Chlorantraniliprole", "150 ml bottle", 1250, 4],
  ["Fipronil SC", "insecticide", "Fipronil", "1 L bottle", 780, 9],
  ["Spinosad SC", "insecticide", "Spinosad", "75 ml bottle", 890, 0],
  ["Spiromesifen SC", "insecticide", "Spiromesifen (for mites)", "250 ml bottle", 1450, 3],
  ["Monocrotophos SL", "insecticide", "Monocrotophos", "1 L bottle", 450, 6],
  ["Neem oil (Azadirachtin)", "bio", "Azadirachtin", "1 L bottle", 420, 16],
  ["Trichoderma viride", "bio", "Trichoderma viride (soil-borne fungi)", "1 kg pack", 180, 20],
  ["Pseudomonas fluorescens", "bio", "Pseudomonas fluorescens", "1 kg pack", 190, 12],
  ["Streptocycline", "other", "Streptomycin + Tetracycline (bacterial diseases)", "6 g pack", 60, 40],
  ["Zinc sulphate", "fertiliser", "Zinc", "5 kg bag", 350, 22],
  ["Ferrous sulphate", "fertiliser", "Iron", "5 kg bag", 300, 10],
  ["Magnesium sulphate", "fertiliser", "Magnesium", "5 kg bag", 280, 2],
  ["Boron (disodium octaborate)", "fertiliser", "Boron", "1 kg pack", 420, 0],
  ["NPK 19:19:19 water soluble", "fertiliser", "Nitrogen, Phosphorus, Potassium", "1 kg pack", 160, 50],
  ["Glyphosate SL", "herbicide", "Glyphosate", "1 L bottle", 480, 11],
];

export const SAMPLE_INVENTORY: Product[] = SAMPLE_ROWS.map(([name, kind, ingredient, unit, price, qty], i) => ({
  id: `s${i + 1}`,
  name,
  kind,
  ingredient,
  crops: [],
  qty,
  price,
  unit,
}));

export function newProductId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function isBannedProduct(p: Pick<Product, "name" | "ingredient">): boolean {
  return hasBanned(`${p.name} ${p.ingredient}`);
}

// --- CSV --------------------------------------------------------------------

export const CSV_HEADER = ["name", "type", "active_ingredient", "crops", "stock", "price", "unit"];

export const CSV_TEMPLATE = [
  CSV_HEADER.join(","),
  "Mancozeb WP,fungicide,Mancozeb,,24,320,500 g pack",
  "Imidacloprid SL,insecticide,Imidacloprid,cotton;soybean,20,380,250 ml bottle",
  "Zinc sulphate,fertiliser,Zinc,,0,350,5 kg bag",
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

// "24" -> 24. Older files said yes/no: yes (or empty) -> 1, no -> 0.
function toQty(value: string): number {
  const v = value.toLowerCase().replace(/,/g, "");
  if (!v) return 1;
  if (["no", "n", "false", "नाही", "नहीं"].includes(v)) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 1;
}

function toPrice(value: string): number {
  const n = Number(value.replace(/[₹,\s]|rs\.?/gi, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
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
  const iStock = col(["stock", "in_stock", "quantity", "qty"]);
  const iPrice = col(["price", "mrp", "rate", "selling_price"]);
  const iUnit = col(["unit", "pack", "pack_size", "size"]);
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
      qty: toQty(get(row, iStock)),
      price: toPrice(get(row, iPrice)),
      unit: get(row, iUnit).slice(0, 30),
    }));
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function inventoryToCsv(products: Product[]): string {
  const lines = products.map((p) =>
    [p.name, p.kind, p.ingredient, p.crops.join(";"), String(p.qty), String(p.price), p.unit].map(csvCell).join(","),
  );
  return [CSV_HEADER.join(","), ...lines].join("\n");
}
