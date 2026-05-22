import { invoke } from "@tauri-apps/api/core";
import type { Channel } from "../types";

type DiscordActivityType = "playing" | "listening" | "watching" | "competing";
type DiscordStatusDisplay = "name" | "state" | "details";

type DiscordButton = { label: string; url: string };

type DiscordActivity = {
  details?: string;
  detailsUrl?: string;
  stateText?: string;
  stateUrl?: string;
  largeImage?: string;
  largeText?: string;
  largeUrl?: string;
  smallImage?: string;
  smallText?: string;
  startedAt?: number;
  activityType?: DiscordActivityType;
  statusDisplayType?: DiscordStatusDisplay;
  buttons?: DiscordButton[];
};

let connected = false;
let lastSerialized: string | null = null;
let pendingTimer: number | undefined;
let pendingActivity: DiscordActivity | null = null;

async function connect(): Promise<boolean> {
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
  activityMode = null;
  if (pendingTimer !== undefined) {
    clearTimeout(pendingTimer);
    pendingTimer = undefined;
  }
}

// Discord throttles activity updates server-side (~5 per 20s). Debounce
// rapid changes — e.g. quickly cycling channels with Alt+Arrow.
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
    await invoke("discord_set_activity", {
      details: activity.details ?? null,
      detailsUrl: activity.detailsUrl ?? null,
      stateText: activity.stateText ?? null,
      stateUrl: activity.stateUrl ?? null,
      largeImage: activity.largeImage ?? null,
      largeText: activity.largeText ?? null,
      largeUrl: activity.largeUrl ?? null,
      smallImage: activity.smallImage ?? null,
      smallText: activity.smallText ?? null,
      startedAt: activity.startedAt ?? null,
      activityType: activity.activityType ?? null,
      statusDisplayType: activity.statusDisplayType ?? null,
      buttons: activity.buttons ?? null,
    });
    lastSerialized = serialized;
  } catch {
    connected = false;
  }
}

const SELF_LURK_PHRASES = [
  "Talking to themselves",
  "Empty room energy",
  "Practicing the intro",
  "Solo in the chat",
  "Self-lurking",
  "Reading own chat alone",
  "Plotting the next stream",
  "Tumbleweeds rolling by",
];

const viewerFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const clamp = (s: string, max: number) =>
  s.length > max ? s.slice(0, max - 1) + "…" : s;

let activityMode: string | null = null;
let activityStartedAt = Math.floor(Date.now() / 1000);
let selfLurkPhrase = SELF_LURK_PHRASES[0];

export type PresenceContext = {
  enabled: boolean;
  authenticated: boolean;
  userId: string | null;
  channel: Channel | null;
  inboxOpen: boolean;
  liveChannels: Channel[];
};

export function applyDiscordPresence(ctx: PresenceContext): void {
  if (!ctx.enabled || !ctx.authenticated) {
    activityMode = null;
    void disconnectDiscord();
    return;
  }
  const ch = ctx.channel;
  const mode = ctx.inboxOpen ? "inbox" : ch ? `ch:${ch.user_id}` : "browsing";
  if (mode !== activityMode) {
    activityMode = mode;
    activityStartedAt = Math.floor(Date.now() / 1000);
    selfLurkPhrase = SELF_LURK_PHRASES[Math.floor(Math.random() * SELF_LURK_PHRASES.length)];
  }

  if (mode === "inbox") {
    scheduleActivity({
      details: "Reading mentions",
      largeImage: "app_logo",
      largeText: "Deatch",
      startedAt: activityStartedAt,
      activityType: "watching",
      statusDisplayType: "details",
    });
  } else if (ch) {
    const live = ctx.liveChannels.find((c) => c.user_id === ch.user_id);
    const isOwnChannel = ch.user_id === ctx.userId;
    const stateText = live?.game_name
      ? live.viewer_count != null
        ? `${live.game_name} · ${viewerFormatter.format(live.viewer_count)} viewers`
        : live.game_name
      : isOwnChannel
        ? selfLurkPhrase
        : "Offline";
    const streamStartedAt = live?.started_at
      ? Math.floor(new Date(live.started_at).getTime() / 1000)
      : null;
    const channelUrl = `https://twitch.tv/${ch.user_login}`;
    const categoryUrl = live?.game_name
      ? `https://www.twitch.tv/directory/game/${encodeURIComponent(live.game_name)}`
      : undefined;
    scheduleActivity({
      details: ch.user_name || ch.user_login,
      detailsUrl: channelUrl,
      stateText,
      stateUrl: categoryUrl,
      largeImage: ch.profile_image_url || "app_logo",
      largeText: live?.title ? clamp(live.title, 128) : ch.user_name || ch.user_login,
      largeUrl: channelUrl,
      smallImage: "app_logo",
      smallText: "Deatch",
      startedAt: streamStartedAt ?? activityStartedAt,
      activityType: "watching",
      statusDisplayType: "details",
      buttons: [{ label: "Open on Twitch", url: channelUrl }],
    });
  } else {
    scheduleActivity({
      details: "Browsing channels",
      stateText: "On Twitch",
      largeImage: "app_logo",
      largeText: "Deatch",
      startedAt: activityStartedAt,
      activityType: "watching",
      statusDisplayType: "details",
    });
  }
  void connect();
}
