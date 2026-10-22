// The dealer's own settings: shop details, which crops to show, what the Home
// screen shows, and when to warn about low stock. Saved on this device only.

import { z } from "zod";
import { CROPS, LANGS, type CropId, type Lang } from "./crops";

export const HOME_WIDGETS = ["sales", "lowStock", "credit", "recent", "tips"] as const;
export type HomeWidget = (typeof HOME_WIDGETS)[number];

const cropIds = CROPS.map((c) => c.id) as [CropId, ...CropId[]];
const langIds = LANGS.map((l) => l.id) as [Lang, ...Lang[]];

export const SettingsSchema = z.object({
  shopName: z.string().max(80).default(""),
  ownerName: z.string().max(80).default(""),
  phone: z.string().max(20).default(""),
  address: z.string().max(200).default(""),
  defaultLang: z.enum(langIds).default("mr"),
  // Crops shown on the "Check crop" screen. Empty = show all.
  crops: z.array(z.enum(cropIds)).default([]),
  lowStockAt: z.number().int().min(0).max(1000).default(5),
  billNote: z.string().max(200).default(""),
  home: z
    .object({
      sales: z.boolean().default(true),
      lowStock: z.boolean().default(true),
      credit: z.boolean().default(true),
      recent: z.boolean().default(true),
      tips: z.boolean().default(true),
    })
    .default({ sales: true, lowStock: true, credit: true, recent: true, tips: true }),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});

export function parseSettings(value: unknown): Settings | null {
  const r = SettingsSchema.safeParse(value);
  return r.success ? r.data : null;
}

export function visibleCrops(settings: Settings) {
  return settings.crops.length ? CROPS.filter((c) => settings.crops.includes(c.id)) : CROPS;
}
