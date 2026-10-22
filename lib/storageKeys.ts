// Where each kind of data is saved in the browser. Used by the app and by
// the backup / restore feature in Settings.

export const KEYS = {
  lang: "fasalai.lang",
  settings: "fasalai.settings.v1",
  inventory: "fasalai.inventory.v1",
  bills: "fasalai.bills.v1",
  recent: "fasalai.recent.v1",
} as const;

export const BACKUP_VERSION = 1;
