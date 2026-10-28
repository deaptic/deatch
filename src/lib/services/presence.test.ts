import { expect, test } from "vite-plus/test";
import { formatViewers } from "../format/stream.ts";
import type { Stream, User } from "../types/index.ts";
import {
  buildPresence,
  type PresenceContext,
  presenceMode,
} from "./presence.ts";

const channel: User = {
  id: "1",
  login: "maya",
  displayName: "Maya",
  description: "",
  profileImageUrl: "https://cdn/maya.png",
  offlineImageUrl: null,
  broadcasterType: "partner",
  createdAt: "2020-01-01T00:00:00Z",
};

const stream = (extra: Partial<Stream> = {}): Stream => ({
  id: "s1",
  user: { id: "1", login: "maya", displayName: "Maya" },
  game: { id: "g1", name: "Chess" },
  title: "Chess with chat",
  viewerCount: 1234,
  startedAt: "2026-10-01T10:00:00Z",
  language: "en",
  thumbnailUrl: "",
  tags: [],
  isMature: false,
  ...extra,
});

const ctx = (extra: Partial<PresenceContext> = {}): PresenceContext => ({
  enabled: true,
  authenticated: true,
  userId: "me",
  channel,
  exploreOpen: false,
  liveStreams: [],
  ...extra,
});

const session = {
  startedAt: 100,
  lurkPhrase: "PRESENCE_LURK_SELF_LURKING",
} as const;

test("no presence when disabled or signed out", () => {
  expect(presenceMode(ctx({ enabled: false }))).toBeNull();
  expect(presenceMode(ctx({ authenticated: false }))).toBeNull();
});

test("Explore or no channel counts as browsing", () => {
  expect(presenceMode(ctx({ exploreOpen: true }))).toBe("browsing");
  expect(presenceMode(ctx({ channel: null }))).toBe("browsing");
  const activity = buildPresence(ctx({ exploreOpen: true }), session);
  expect(activity.details).toBe("Browsing channels");
  expect(activity.startedAt).toBe(100);
});

test("a live channel shows its game, viewers and stream start", () => {
  const activity = buildPresence(ctx({ liveStreams: [stream()] }), session);
  expect(presenceMode(ctx())).toBe("ch:1");
  expect(activity.stateText).toBe(`Chess · ${formatViewers(1234)} viewers`);
  expect(activity.largeText).toBe("Chess with chat");
  expect(activity.startedAt).toStrictEqual(
    Date.parse("2026-10-01T10:00:00Z") / 1000,
  );
});

test("an offline channel is Offline, your own shows the lurk phrase", () => {
  expect(buildPresence(ctx(), session).stateText).toBe("Offline");
  const own = buildPresence(ctx({ userId: "1" }), session);
  expect(own.stateText).toBe("Self-lurking");
  expect(own.startedAt).toBe(100);
});

test("long titles are cut without splitting an emoji", () => {
  const title = "a".repeat(126) + "😀" + "tail";
  const { largeText } = buildPresence(
    ctx({ liveStreams: [stream({ title })] }),
    session,
  );
  expect(largeText).toStrictEqual("a".repeat(126) + "…");
  expect(largeText!.length <= 128).toBe(true);
});
