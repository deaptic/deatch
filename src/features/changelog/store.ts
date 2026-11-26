import { createSignal } from "solid-js";
import { appVersion } from "../../platform/app.ts";
import * as storage from "../../platform/storage.ts";
import { STORAGE_KEYS } from "../../platform/storageKeys.ts";
import type { Notes } from "../../shared/changelog.ts";
import { showChangelog } from "../navigation/index.ts";
import { loadChangelog } from "./load.ts";
import { highlights, isNewToUser } from "./model.ts";

export type Update = { version: string; notes: Notes };

const [update, setUpdate] = createSignal<Update | null>(null);
export { update };

async function check(seen: string | null, usedBefore: boolean) {
  const version = await appVersion({ silent: true });
  storage.writeText(STORAGE_KEYS.seenVersion, version);
  if (!isNewToUser(seen, version, usedBefore)) return;
  const notes = highlights(await loadChangelog(), version);
  if (notes) setUpdate({ version, notes });
}

export function start(): () => void {
  const seen = storage.readText(STORAGE_KEYS.seenVersion);
  const usedBefore = storage.readText(STORAGE_KEYS.users) !== null;
  check(seen, usedBefore).catch((e) =>
    console.warn("changelog: update notes not shown", e),
  );
  return () => {};
}

export function dismiss(): void {
  setUpdate(null);
}

export function openAll(): void {
  setUpdate(null);
  showChangelog();
}
