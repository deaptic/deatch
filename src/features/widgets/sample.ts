import { t } from "../../shared/i18n/index.ts";
import type { User } from "../../shared/types/index.ts";
import type { FeedMessage, Fragment } from "../feed/index.ts";

type Chatter = { name: string; color: string; badge?: string };

const PICTURE =
  "https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png";
const SPACING_MS = 15_000;

const CHATTERS: Chatter[] = [
  { name: "user1", color: "#ff7f50", badge: "moderator" },
  { name: "someone", color: "#1e90ff", badge: "vip" },
  { name: "user3", color: "#9acd32" },
  { name: "user4", color: "#daa520" },
  { name: "user5", color: "#ff69b4" },
];

const KAPPA: Fragment = { type: "emote", text: "Kappa", id: "25" };

const text = (value: string): Fragment => ({ type: "text", text: value });

const lines = (): [number, Fragment[]][] => [
  [0, [text(t("SETTINGS_WIDGETS_PREVIEW_HELLO_LINE"))]],
  [1, [text(`${t("SETTINGS_WIDGETS_PREVIEW_PLAY_LINE")} `), KAPPA]],
  [2, [text("!lurk")]],
  [3, [text(t("SETTINGS_WIDGETS_PREVIEW_LONG_LINE"))]],
  [4, [text(t("SETTINGS_WIDGETS_PREVIEW_QUESTION_LINE"))]],
  [2, [text(t("SETTINGS_WIDGETS_PREVIEW_GG_LINE"))]],
  [0, [text(t("SETTINGS_WIDGETS_PREVIEW_LURK_LINE"))]],
  [1, [KAPPA]],
];

const idOf = (chatter: number) => `preview-${chatter}`;

export function sampleMessages(now: number): FeedMessage[] {
  const all = lines();
  return all.flatMap(([index, fragments], i) => {
    const chatter = CHATTERS[index];
    if (!chatter) return [];
    return [
      {
        kind: "message",
        message_id: `preview-message-${i}`,
        chatter_user_id: idOf(index),
        chatter_login: chatter.name,
        chatter_name: chatter.name,
        color: chatter.color,
        fragments,
        badges: chatter.badge
          ? [{ set_id: chatter.badge, id: "1", info: "" }]
          : [],
        timestamp: now - (all.length - 1 - i) * SPACING_MS,
      },
    ];
  });
}

export function sampleUsers(): User[] {
  return CHATTERS.map((chatter, index) => ({
    id: idOf(index),
    login: chatter.name,
    displayName: chatter.name,
    description: "",
    profileImageUrl: PICTURE,
    offlineImageUrl: null,
    broadcasterType: "normal",
    createdAt: "",
  }));
}
