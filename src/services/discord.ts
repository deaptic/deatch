import { invoke } from "@tauri-apps/api/core";

export type DiscordActivityType = "playing" | "listening" | "watching" | "competing";

export type DiscordButton = { label: string; url: string };

export type DiscordActivity = {
  details?: string;
  stateText?: string;
  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;
  startedAt?: number;
  activityType?: DiscordActivityType;
  buttons?: DiscordButton[];
};

let connected = false;
let lastSerialized: string | null = null;
let pendingTimer: number | undefined;
let pendingActivity: DiscordActivity | null = null;

export async function connectDiscord(): Promise<boolean> {
  if (connected) return true;
  try {
    await invoke("discord_connect", {});
    connected = true;
    return true;
  } catch {
    connected = false;
    return false;
  }
}

export async function disconnectDiscord(): Promise<void> {
  if (!connected) return;
  try {
    await invoke("discord_disconnect");
  } catch {
    // ignore — IPC may already be torn down
  }
  connected = false;
  lastSerialized = null;
  pendingActivity = null;
  if (pendingTimer !== undefined) {
    clearTimeout(pendingTimer);
    pendingTimer = undefined;
  }
}

/// Discord throttles activity updates server-side (~5 per 20s). Debounce
/// rapid changes — e.g. quickly cycling channels with Alt+Arrow.
const UPDATE_DEBOUNCE_MS = 1500;

export function updateActivity(activity: DiscordActivity): void {
  pendingActivity = activity;
  if (pendingTimer !== undefined) return;
  pendingTimer = window.setTimeout(() => {
    pendingTimer = undefined;
    const next = pendingActivity;
    pendingActivity = null;
    if (!next) return;
    flush(next);
  }, UPDATE_DEBOUNCE_MS);
}

async function flush(activity: DiscordActivity): Promise<void> {
  if (!connected) {
    const ok = await connectDiscord();
    if (!ok) return;
  }
  const serialized = JSON.stringify(activity);
  if (serialized === lastSerialized) return;
  try {
    await invoke("discord_set_activity", {
      details: activity.details ?? null,
      stateText: activity.stateText ?? null,
      largeImage: activity.largeImage ?? null,
      largeText: activity.largeText ?? null,
      smallImage: activity.smallImage ?? null,
      smallText: activity.smallText ?? null,
      startedAt: activity.startedAt ?? null,
      activityType: activity.activityType ?? null,
      buttons: activity.buttons ?? null,
    });
    lastSerialized = serialized;
  } catch {
    connected = false;
  }
}
