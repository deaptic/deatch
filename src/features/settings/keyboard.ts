import defaultKeymap from "../../default-keymap.json" with { type: "json" };
import { type MessageKey, t } from "../../shared/i18n/index.ts";

export const CHANNEL_SELECT = /^channel::select(\d)$/;

export const ACTION_LABELS: Record<string, MessageKey> = {
  "channel::cycleNext": "SETTINGS_KEYBOARD_CHANNEL_NEXT_LABEL",
  "channel::cyclePrev": "SETTINGS_KEYBOARD_CHANNEL_PREVIOUS_LABEL",
  "channel::back": "SETTINGS_KEYBOARD_CHANNEL_BACK_LABEL",
  "channel::forward": "SETTINGS_KEYBOARD_CHANNEL_FORWARD_LABEL",
  "explore::show": "SETTINGS_KEYBOARD_EXPLORE_LABEL",
  "settings::toggle": "SETTINGS_KEYBOARD_SETTINGS_LABEL",
  "rail::toggle": "SETTINGS_KEYBOARD_RAIL_LABEL",
  "inbox::toggle": "SETTINGS_KEYBOARD_INBOX_LABEL",
  "inbox::whispers": "SETTINGS_KEYBOARD_WHISPERS_LABEL",
  "appearance::toggle": "SETTINGS_KEYBOARD_APPEARANCE_LABEL",
  "changelog::show": "SETTINGS_KEYBOARD_CHANGELOG_LABEL",
  "help::shortcuts": "SETTINGS_KEYBOARD_SHORTCUTS_LABEL",
  "inboxPage::switchTab": "SETTINGS_KEYBOARD_INBOX_SWITCH_TAB_LABEL",
  "inboxPage::selectPrev": "SETTINGS_KEYBOARD_INBOX_SELECT_PREVIOUS_LABEL",
  "inboxPage::selectNext": "SETTINGS_KEYBOARD_INBOX_SELECT_NEXT_LABEL",
  "inboxPage::open": "SETTINGS_KEYBOARD_INBOX_OPEN_LABEL",
  "inboxPage::markRead": "SETTINGS_KEYBOARD_INBOX_MARK_READ_LABEL",
  "settingsPage::sectionPrev": "SETTINGS_KEYBOARD_SETTINGS_PREVIOUS_LABEL",
  "settingsPage::sectionNext": "SETTINGS_KEYBOARD_SETTINGS_NEXT_LABEL",
  "emotePicker::toggle": "SETTINGS_KEYBOARD_EMOTE_PICKER_LABEL",
  "quickSwitch::toggle": "SETTINGS_KEYBOARD_QUICK_SWITCH_LABEL",
  "mod::arm": "SETTINGS_KEYBOARD_MOD_ARM_LABEL",
  "mod::delete": "SETTINGS_KEYBOARD_MOD_DELETE_LABEL",
  "mod::purge": "SETTINGS_KEYBOARD_MOD_PURGE_LABEL",
  "mod::timeout": "SETTINGS_KEYBOARD_MOD_TIMEOUT_LABEL",
  "mod::ban": "SETTINGS_KEYBOARD_MOD_BAN_LABEL",
  "feed::userCard": "SETTINGS_KEYBOARD_USER_CARD_LABEL",
  "search::toggle": "SETTINGS_KEYBOARD_SEARCH_LABEL",
  "link::toggle": "SETTINGS_KEYBOARD_LINK_SYNC_LABEL",
  "link::toggleAudioLink": "SETTINGS_KEYBOARD_LINK_AUDIO_LABEL",
  "link::toggleMute": "SETTINGS_KEYBOARD_LINK_MUTE_LABEL",
  "link::toggleMuteAll": "SETTINGS_KEYBOARD_LINK_MUTE_ALL_LABEL",
  "link::muteOthers": "SETTINGS_KEYBOARD_LINK_MUTE_OTHERS_LABEL",
  "link::closeTab": "SETTINGS_KEYBOARD_LINK_CLOSE_TAB_LABEL",
  "link::openTab": "SETTINGS_KEYBOARD_LINK_CLOSE_TAB_LABEL",
  "view::toggleAlwaysOnTop": "SETTINGS_KEYBOARD_ALWAYS_ON_TOP_LABEL",
  "panel::close": "SETTINGS_KEYBOARD_CLOSE_PANEL_LABEL",
  "feed::toggleDensity": "SETTINGS_KEYBOARD_TOGGLE_DENSITY_LABEL",
  "view::zoomIn": "SETTINGS_KEYBOARD_ZOOM_IN_LABEL",
  "view::zoomOut": "SETTINGS_KEYBOARD_ZOOM_OUT_LABEL",
  "view::zoomReset": "SETTINGS_KEYBOARD_ZOOM_RESET_LABEL",
  "chat::send": "SETTINGS_KEYBOARD_SEND_LABEL",
  "chat::tabComplete": "SETTINGS_KEYBOARD_TAB_COMPLETE_LABEL",
  "chat::recallPrev": "SETTINGS_KEYBOARD_RECALL_PREVIOUS_LABEL",
  "chat::recallNext": "SETTINGS_KEYBOARD_RECALL_NEXT_LABEL",
  "feed::selectPrev": "SETTINGS_KEYBOARD_FEED_SELECT_PREVIOUS_LABEL",
  "feed::selectNext": "SETTINGS_KEYBOARD_FEED_SELECT_NEXT_LABEL",
  "feed::reply": "SETTINGS_KEYBOARD_FEED_REPLY_LABEL",
  "feed::copy": "SETTINGS_KEYBOARD_FEED_COPY_LABEL",
  "emotePicker::favorite": "SETTINGS_KEYBOARD_EMOTE_FAVORITE_LABEL",
  "emotePicker::insertKeepOpen": "SETTINGS_KEYBOARD_EMOTE_KEEP_OPEN_LABEL",
  "quickSwitch::openPinned": "SETTINGS_KEYBOARD_QUICK_SWITCH_PIN_LABEL",
};

export type ShortcutGroup = { title: MessageKey; prefix: string[] };

export const SHORTCUT_GROUPS = {
  navigation: {
    title: "SETTINGS_KEYBOARD_GROUP_NAVIGATION_TITLE",
    prefix: ["channel::", "explore::", "settings::", "changelog::"],
  },
  panels: {
    title: "SETTINGS_KEYBOARD_GROUP_PANELS_TITLE",
    prefix: [
      "rail::",
      "inbox::",
      "appearance::",
      "emotePicker::",
      "quickSwitch::",
      "search::",
      "panel::",
      "help::",
    ],
  },
  link: { title: "SETTINGS_KEYBOARD_GROUP_LINK_TITLE", prefix: ["link::"] },
  view: { title: "SETTINGS_KEYBOARD_GROUP_VIEW_TITLE", prefix: ["view::"] },
  chat: {
    title: "SETTINGS_KEYBOARD_GROUP_CHAT_TITLE",
    prefix: ["feed::", "chat::"],
  },
  moderation: {
    title: "SETTINGS_KEYBOARD_GROUP_MODERATION_TITLE",
    prefix: ["mod::"],
  },
  inbox: {
    title: "SETTINGS_KEYBOARD_GROUP_INBOX_TITLE",
    prefix: ["inboxPage::"],
  },
  settings: {
    title: "SETTINGS_KEYBOARD_GROUP_SETTINGS_TITLE",
    prefix: ["settingsPage::"],
  },
} satisfies Record<string, ShortcutGroup>;

export type ShortcutRow = { combo: string; label: string };

function actionLabel(action: string): string {
  const slot = CHANNEL_SELECT.exec(action)?.[1];
  if (slot) return t("SETTINGS_KEYBOARD_CHANNEL_SELECT_LABEL", { slot });
  const key = ACTION_LABELS[action];
  return key ? t(key) : action;
}

export function shortcutRows(group: ShortcutGroup): ShortcutRow[] {
  return Object.entries(defaultKeymap as Record<string, string[]>).flatMap(
    ([combo, actions]) => {
      const action = actions.find((a) =>
        group.prefix.some((p) => a.startsWith(p)),
      );
      return action ? [{ combo, label: actionLabel(action) }] : [];
    },
  );
}
