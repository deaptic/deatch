import type { MentionKind } from "../../shared/mentions.ts";
import { prefs, setPrefs } from "./core.ts";

export const inboxShows = (kind: MentionKind) => prefs.inbox.shows[kind];

export function setInboxShows(kind: MentionKind, on: boolean) {
  setPrefs("inbox", "shows", kind, on);
}
