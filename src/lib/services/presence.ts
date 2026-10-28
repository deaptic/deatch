import type {
  SetActivityParams,
  NonEmpty,
  Stream,
  User,
} from "../types/index.ts";
import { formatViewers } from "../format/stream.ts";
import { categoryUrl, channelUrl } from "../utils/twitchUrl.ts";
import { type MessageKey, t } from "../i18n/index.ts";

export const SELF_LURK_PHRASES: NonEmpty<MessageKey> = [
  "PRESENCE_LURK_TALKING_TO_THEMSELVES",
  "PRESENCE_LURK_EMPTY_ROOM",
  "PRESENCE_LURK_PRACTICING_INTRO",
  "PRESENCE_LURK_SOLO",
  "PRESENCE_LURK_SELF_LURKING",
  "PRESENCE_LURK_READING_OWN_CHAT",
  "PRESENCE_LURK_PLOTTING",
  "PRESENCE_LURK_TUMBLEWEEDS",
];

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

type PresenceSession = { startedAt: number; lurkPhrase: MessageKey };

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
): SetActivityParams {
  const ch = activeChannel(ctx);
  if (!ch) {
    return {
      details: t("PRESENCE_BROWSING"),
      stateText: t("PRESENCE_ON_TWITCH"),
      largeImage: "app_logo",
      largeText: "Deatch",
      startedAt: session.startedAt,
    };
  }
  const stream = ctx.liveStreams.find((s) => s.user.id === ch.id);
  const isOwnChannel = ch.id === ctx.userId;
  const gameName = stream?.game.name;
  const stateText =
    stream && gameName
      ? t("PRESENCE_PLAYING", {
          game: gameName,
          count: stream.viewerCount,
          viewers: formatViewers(stream.viewerCount),
        })
      : isOwnChannel
        ? t(session.lurkPhrase)
        : t("PRESENCE_OFFLINE");
  const streamStartedAt = stream
    ? Math.floor(new Date(stream.startedAt).getTime() / 1000)
    : null;
  const url = channelUrl(ch.login);
  return {
    details: ch.displayName || ch.login,
    detailsUrl: url,
    stateText,
    stateUrl: gameName ? categoryUrl(gameName) : undefined,
    largeImage: ch.profileImageUrl || "app_logo",
    largeText: stream?.title
      ? clamp(stream.title, 128)
      : ch.displayName || ch.login,
    largeUrl: url,
    smallImage: "app_logo",
    smallText: "Deatch",
    startedAt: streamStartedAt ?? session.startedAt,
    buttons: [{ label: t("PRESENCE_OPEN_ON_TWITCH"), url }],
  };
}
