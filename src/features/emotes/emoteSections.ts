import { t } from "../../shared/i18n/index.ts";
import type {
  Emote,
  EmoteEntry,
  User,
  UserEmote,
} from "../../lib/types/index.ts";
import { isUserId } from "../../shared/user.ts";

export type EmoteSection = { id: string; label: string; emotes: EmoteEntry[] };

type ThirdParty = {
  sevenTv: readonly EmoteEntry[];
  bttv: readonly EmoteEntry[];
  ffz: readonly EmoteEntry[];
};

const EMOJI = /^\p{RGI_Emoji}$/v;

export function usableIn(sections: EmoteSection[]): (value: string) => boolean {
  const names = new Set(sections.flatMap((s) => s.emotes.map((e) => e.name)));
  return (value) => names.has(value) || EMOJI.test(value);
}

export function dedupeById(list: UserEmote[]): UserEmote[] {
  const seen = new Set<string>();
  const out: UserEmote[] = [];
  for (const e of list) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

function sortByName<T extends { name: string }>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

function byName(entries: Map<string, string>): EmoteEntry[] {
  return sortByName([...entries].map(([name, url]) => ({ name, url })));
}

function thirdPartySections(
  lists: ThirdParty,
  idSuffix: string,
): EmoteSection[] {
  const sections: [string, string, readonly EmoteEntry[]][] = [
    ["7tv", t("EMOTES_SECTION_7TV_TITLE"), lists.sevenTv],
    ["bttv", t("EMOTES_SECTION_BTTV_TITLE"), lists.bttv],
    ["ffz", t("EMOTES_SECTION_FFZ_TITLE"), lists.ffz],
  ];
  return sections
    .filter(([, , emotes]) => emotes.length > 0)
    .map(([id, label, emotes]) => ({
      id: id + idSuffix,
      label,
      emotes: sortByName(emotes),
    }));
}

export function channelSections(
  broadcaster: User | null,
  userEmotes: readonly UserEmote[],
  channel: ThirdParty,
): EmoteSection[] {
  const own = new Map<string, string>();
  for (const e of userEmotes) {
    if (broadcaster && e.ownerId === broadcaster.id && !own.has(e.name)) {
      own.set(e.name, e.url);
    }
  }
  const twitch: EmoteSection[] =
    broadcaster && own.size > 0
      ? [{ id: "twitch", label: broadcaster.displayName, emotes: byName(own) }]
      : [];
  return [...twitch, ...thirdPartySections(channel, "-channel")];
}

export function globalSections(
  broadcaster: User | null,
  userEmotes: readonly UserEmote[],
  globalEmotes: readonly Emote[],
  global: ThirdParty,
  displayNameOf: (userId: string) => string | undefined,
): EmoteSection[] {
  const bySub = new Map<string, EmoteEntry[]>();
  const twitch = new Map<string, string>();
  for (const e of userEmotes) {
    if (e.ownerId === broadcaster?.id) continue;
    if (e.emoteType === "subscriptions" && e.ownerId && isUserId(e.ownerId)) {
      const list = bySub.get(e.ownerId) ?? [];
      list.push({ name: e.name, url: e.url });
      bySub.set(e.ownerId, list);
    } else {
      twitch.set(e.name, e.url);
    }
  }
  for (const e of globalEmotes) {
    if (!twitch.has(e.name)) twitch.set(e.name, e.url);
  }

  const subscriptions = [...bySub]
    .map(([ownerId, emotes]) => ({
      id: `channel-${ownerId}`,
      label: displayNameOf(ownerId) ?? ownerId,
      emotes: sortByName(emotes),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const twitchGlobal: EmoteSection[] =
    twitch.size > 0
      ? [
          {
            id: "twitch-global",
            label: t("EMOTES_SECTION_TWITCH_GLOBAL_TITLE"),
            emotes: byName(twitch),
          },
        ]
      : [];
  return [...subscriptions, ...twitchGlobal, ...thirdPartySections(global, "")];
}
