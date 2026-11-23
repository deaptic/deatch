export type EmoteProvider = "twitch" | "sevenTv" | "betterTtv" | "frankerFaceZ";

export type EmoteSource = {
  provider: EmoteProvider;
  id: string;
  page: string | null;
};

export type EmoteScope = "channel" | "global";

export type KnownEmotes = {
  channelUrls: ReadonlySet<string>;
  globalUrls: ReadonlySet<string>;
  twitchGlobalIds: ReadonlySet<string>;
};

export const PROVIDER_NAMES: Record<EmoteProvider, string> = {
  twitch: "Twitch",
  sevenTv: "7TV",
  betterTtv: "BetterTTV",
  frankerFaceZ: "FrankerFaceZ",
};

const PROVIDERS: Record<
  EmoteProvider,
  { cdn: RegExp; page: (id: string) => string | null }
> = {
  twitch: {
    cdn: /^https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v2\/([^/]+)\//,
    page: () => null,
  },
  sevenTv: {
    cdn: /^https:\/\/cdn\.7tv\.app\/emote\/([^/]+)\//,
    page: (id) => `https://7tv.app/emotes/${id}`,
  },
  betterTtv: {
    cdn: /^https:\/\/cdn\.betterttv\.net\/emote\/([^/]+)\//,
    page: (id) => `https://betterttv.com/emotes/${id}`,
  },
  frankerFaceZ: {
    cdn: /^https:\/\/cdn\.frankerfacez\.com\/emote\/([^/]+)\//,
    page: (id) => `https://www.frankerfacez.com/emoticon/${id}`,
  },
};

export function emoteSource(url: string): EmoteSource | null {
  for (const [provider, { cdn, page }] of Object.entries(PROVIDERS)) {
    const id = cdn.exec(url)?.[1];
    if (id) return { provider: provider as EmoteProvider, id, page: page(id) };
  }
  return null;
}

export function emoteScope(
  source: EmoteSource,
  url: string,
  known: KnownEmotes,
): EmoteScope | null {
  if (source.provider === "twitch") {
    return known.twitchGlobalIds.has(source.id) ? "global" : null;
  }
  if (known.channelUrls.has(url)) return "channel";
  if (known.globalUrls.has(url)) return "global";
  return null;
}
