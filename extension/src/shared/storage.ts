export type Flag =
  | "autoClaim"
  | "autoDrops"
  | "gainControl"
  | "compressorControl"
  | "playerStats";

const FLAG_DEFAULTS: Record<Flag, boolean> = {
  autoClaim: false,
  autoDrops: false,
  gainControl: true,
  compressorControl: true,
  playerStats: false,
};

export const readFlag = (key: Flag, value: unknown): boolean =>
  typeof value === "boolean" ? value : FLAG_DEFAULTS[key];

export async function loadFlag(key: Flag): Promise<boolean> {
  const stored = await chrome.storage.local.get(key);
  return readFlag(key, stored[key]);
}

export function saveFlag(key: Flag, on: boolean): Promise<void> {
  return chrome.storage.local.set({ [key]: on });
}

export function onStored(key: string, listener: (value: unknown) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    const change = changes[key];
    if (area === "local" && change) listener(change.newValue);
  });
}

export function onFlag(key: Flag, listener: (on: boolean) => void) {
  onStored(key, (value) => listener(readFlag(key, value)));
}

export function watchFlag(key: Flag, listener: (on: boolean) => void) {
  void loadFlag(key).then(listener);
  onFlag(key, listener);
}
