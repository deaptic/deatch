import {
  discordConnect,
  discordDisconnect,
  discordSetActivity,
} from "../api/discord.ts";
import type { ActivityInput as DiscordActivity } from "../types/index.ts";
import {
  buildPresence,
  type PresenceContext,
  presenceMode,
  SELF_LURK_PHRASES,
} from "./presence.ts";
import { at } from "../utils/at.ts";

let activityMode: string | null = null;
let activityStartedAt = Math.floor(Date.now() / 1000);
let selfLurkPhrase = SELF_LURK_PHRASES[0];

let connected = false;
let lastSerialized: string | null = null;
let pendingTimer: number | undefined;
let pendingActivity: DiscordActivity | null = null;

async function connect(): Promise<boolean> {
  if (connected) return true;
  try {
    await discordConnect({ silent: true });
    connected = true;
    lastSerialized = null;
    if (activityMode === null) {
      await disconnect();
      return false;
    }
    return true;
  } catch {
    connected = false;
    return false;
  }
}

async function disconnect(): Promise<void> {
  clearTimeout(pendingTimer);
  pendingTimer = undefined;
  pendingActivity = null;
  activityMode = null;
  if (!connected) return;
  try {
    await discordDisconnect({ silent: true });
  } catch {
    // ignore — IPC may already be torn down
  }
  connected = false;
  lastSerialized = null;
}

// Discord throttles activity updates server-side (~5 per 20s). Debounce
// rapid changes — e.g. quickly cycling channels with Ctrl+Tab.
const UPDATE_DEBOUNCE_MS = 1500;

function scheduleActivity(activity: DiscordActivity): void {
  pendingActivity = activity;
  if (pendingTimer !== undefined) return;
  pendingTimer = window.setTimeout(() => {
    pendingTimer = undefined;
    const next = pendingActivity;
    pendingActivity = null;
    if (next) void flush(next);
  }, UPDATE_DEBOUNCE_MS);
}

async function flush(activity: DiscordActivity): Promise<void> {
  if (!connected && !(await connect())) return;
  const serialized = JSON.stringify(activity);
  if (serialized === lastSerialized) return;
  try {
    await discordSetActivity(activity, { silent: true });
    lastSerialized = serialized;
  } catch {
    connected = false;
    lastSerialized = null;
  }
}

export function applyPresence(ctx: PresenceContext): void {
  const mode = presenceMode(ctx);
  if (mode === null) {
    activityMode = null;
    void disconnect();
    return;
  }
  if (mode !== activityMode) {
    activityMode = mode;
    activityStartedAt = Math.floor(Date.now() / 1000);
    selfLurkPhrase = at(
      SELF_LURK_PHRASES,
      Math.floor(Math.random() * SELF_LURK_PHRASES.length),
    );
  }
  scheduleActivity(
    buildPresence(ctx, {
      startedAt: activityStartedAt,
      lurkPhrase: selfLurkPhrase,
    }),
  );
  void connect();
}
