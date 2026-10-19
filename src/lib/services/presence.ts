import type {
  ActivityInput as DiscordActivity,
  Stream,
  User,
} from "../types/index.ts";
import { channelUrl } from "../utils/twitchUrl.ts";

export const SELF_LURK_PHRASES = [
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

// Cutting between the halves of a surrogate pair leaves invalid UTF-16 that
// the backend's JSON parser rejects, so a dangling high half is dropped.
const clamp = (s: string, max: number) =>
  s.length > max
    ? s.slice(0, max - 1).replace(/[\uD800-\uDBFF]$/, "") + "…"
    : s;

export type PresenceContext = {
  enabled: boolean;
  authenticated: boolean;
  userId: string | null;
  channel: User | null;
  exploreOpen: boolean;
  liveStreams: Stream[];
};

export type PresenceSession = { startedAt: number; lurkPhrase: string };

function activeChannel(ctx: PresenceContext): User | null {
  return ctx.exploreOpen ? null : ctx.channel;
}

export function presenceMode(ctx: PresenceContext): string | null {
  if (!ctx.enabled || !ctx.authenticated) return null;
  const ch = activeChannel(ctx);
  return ch ? `ch:${ch.id}` : "browsing";
}

export function buildPresence(
  ctx: PresenceContext,
  session: PresenceSession,
): DiscordActivity {
  const ch = activeChannel(ctx);
  if (!ch) {
    return {
      details: "Browsing channels",
      stateText: "On Twitch",
      largeImage: "app_logo",
      largeText: "Deatch",
      startedAt: session.startedAt,
    };
  }
  const stream = ctx.liveStreams.find((s) => s.user.id === ch.id);
  const isOwnChannel = ch.id === ctx.userId;
  const gameName = stream?.game.name;
  const stateText = gameName
    ? `${gameName} · ${viewerFormatter.format(stream!.viewerCount)} viewers`
    : isOwnChannel
    ? session.lurkPhrase
    : "Offline";
  const streamStartedAt = stream
    ? Math.floor(new Date(stream.startedAt).getTime() / 1000)
    : null;
  const url = channelUrl(ch.login);
  const categoryUrl = gameName
    ? `https://www.twitch.tv/directory/game/${encodeURIComponent(gameName)}`
    : undefined;
  return {
    details: ch.displayName || ch.login,
    detailsUrl: url,
    stateText,
    stateUrl: categoryUrl,
    largeImage: ch.profileImageUrl || "app_logo",
    largeText: stream?.title
      ? clamp(stream.title, 128)
      : ch.displayName || ch.login,
    largeUrl: url,
    smallImage: "app_logo",
    smallText: "Deatch",
    startedAt: streamStartedAt ?? session.startedAt,
    buttons: [{ label: "Open on Twitch", url }],
  };
}
