import {
  discordConnect,
  discordDisconnect,
  discordSetActivity,
  type ActivityInput as DiscordActivity,
} from "../api/discord";
import type { Stream } from "../types/twitch/stream";
import type { User } from "../types/twitch/user";

let connected = false;
let lastSerialized: string | null = null;
let pendingTimer: number | undefined;
let pendingActivity: DiscordActivity | null = null;

async function connect(): Promise<boolean> {
  if (connected) return true;
  try {
    await discordConnect({}, { silent: true });
    connected = true;
    lastSerialized = null;
    return true;
  } catch {
    connected = false;
    return false;
  }
}

export async function disconnectDiscord(): Promise<void> {
  if (!connected) return;
  try {
    await discordDisconnect({ silent: true });
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
    await discordSetActivity(activity, { silent: true });
    lastSerialized = serialized;
  } catch {
    connected = false;
    lastSerialized = null;
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
  channel: User | null;
  inboxOpen: boolean;
  liveStreams: Stream[];
};

export function applyDiscordPresence(ctx: PresenceContext): void {
  if (!ctx.enabled || !ctx.authenticated) {
    activityMode = null;
    void disconnectDiscord();
    return;
  }
  const ch = ctx.channel;
  const mode = ctx.inboxOpen ? "inbox" : ch ? `ch:${ch?.id}` : "browsing";
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
    const stream = ctx.liveStreams.find((s) => s.user.id === ch.id);
    const isOwnChannel = ch.id === ctx.userId;
    const gameName = stream?.game.name;
    const stateText = gameName
      ? `${gameName} · ${viewerFormatter.format(stream!.viewerCount)} viewers`
      : isOwnChannel
        ? selfLurkPhrase
        : "Offline";
    const streamStartedAt = stream
      ? Math.floor(new Date(stream.startedAt).getTime() / 1000)
      : null;
    const channelUrl = `https://twitch.tv/${ch.login}`;
    const categoryUrl = gameName
      ? `https://www.twitch.tv/directory/game/${encodeURIComponent(gameName)}`
      : undefined;
    scheduleActivity({
      details: ch.displayName || ch.login,
      detailsUrl: channelUrl,
      stateText,
      stateUrl: categoryUrl,
      largeImage: ch.profileImageUrl || "app_logo",
      largeText: stream?.title ? clamp(stream.title, 128) : ch.displayName || ch.login,
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
