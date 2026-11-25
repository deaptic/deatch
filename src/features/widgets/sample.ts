import { t } from "../../shared/i18n/index.ts";
import type { User } from "../../shared/types/index.ts";
import type { FeedMessage, Fragment } from "../feed/index.ts";
import type { MessageBadge } from "../../platform/twitch/eventsubPayloads.ts";

export type Me = { user: User; color: string };

type Chatter = {
  id: string;
  login: string;
  name: string;
  color: string;
  badges: MessageBadge[];
  picture: string;
};

const PICTURE =
  "https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png";
const SPACING_MS = 15_000;

const badge = (set_id: string, id = "1"): MessageBadge => ({
  set_id,
  id,
  info: "",
});

const generic = (
  index: number,
  name: string,
  color: string,
  badges: MessageBadge[] = [],
): Chatter => ({
  id: `preview-${index}`,
  login: name.toLowerCase(),
  name,
  color,
  badges,
  picture: PICTURE,
});

function chatters(me: Me | null): Chatter[] {
  const you = me
    ? {
        id: me.user.id,
        login: me.user.login,
        name: me.user.displayName,
        color: me.color,
        badges: [badge("broadcaster")],
        picture: me.user.profileImageUrl,
      }
    : generic(2, "QuietHarbor", "#daa520");
  return [
    generic(0, "MossyPixel", "#ff7f50", [badge("moderator")]),
    generic(1, "kettlebrew", "#1e90ff", [
      badge("vip"),
      badge("subscriber", "0"),
    ]),
    you,
  ];
}

const emote = (name: string, id: string): Fragment => ({
  type: "emote",
  text: name,
  id,
});

const said = (line: string, reaction: Fragment): Fragment[] => [
  { type: "text", text: `${line} ` },
  reaction,
];

const lines = (people: Chatter[]): Fragment[][] => [
  said(
    t("SETTINGS_WIDGETS_PREVIEW_BADGE_LINE"),
    emote("PogChamp", "305954156"),
  ),
  said(t("SETTINGS_WIDGETS_PREVIEW_EMOTE_LINE"), emote("LUL", "425618")),
  [
    {
      type: "text",
      text: t("SETTINGS_WIDGETS_PREVIEW_WRAP_LINE", {
        vip: people[1]?.name ?? "",
      }),
    },
  ],
];

export function sampleMessages(now: number, me: Me | null): FeedMessage[] {
  const people = chatters(me);
  const all = lines(people);
  return all.flatMap((fragments, i) => {
    const chatter = people[i];
    if (!chatter) return [];
    return [
      {
        kind: "message",
        message_id: `preview-message-${i}`,
        chatter_user_id: chatter.id,
        chatter_login: chatter.login,
        chatter_name: chatter.name,
        color: chatter.color,
        fragments,
        badges: chatter.badges,
        timestamp: now - (all.length - 1 - i) * SPACING_MS,
      },
    ];
  });
}

export function sampleUsers(me: Me | null): User[] {
  return chatters(me).map((chatter) => ({
    id: chatter.id,
    login: chatter.login,
    displayName: chatter.name,
    description: "",
    profileImageUrl: chatter.picture,
    offlineImageUrl: null,
    broadcasterType: "normal",
    createdAt: "",
  }));
}
