/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
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

Deno.test("no presence when disabled or signed out", () => {
  assertEquals(presenceMode(ctx({ enabled: false })), null);
  assertEquals(presenceMode(ctx({ authenticated: false })), null);
});

Deno.test("Explore or no channel counts as browsing", () => {
  assertEquals(presenceMode(ctx({ exploreOpen: true })), "browsing");
  assertEquals(presenceMode(ctx({ channel: null })), "browsing");
  const activity = buildPresence(ctx({ exploreOpen: true }), session);
  assertEquals(activity.details, "Browsing channels");
  assertEquals(activity.startedAt, 100);
});

Deno.test("a live channel shows its game, viewers and stream start", () => {
  const activity = buildPresence(ctx({ liveStreams: [stream()] }), session);
  assertEquals(presenceMode(ctx()), "ch:1");
  assertEquals(activity.stateText, "Chess · 1.2K viewers");
  assertEquals(activity.largeText, "Chess with chat");
  assertEquals(activity.startedAt, Date.parse("2026-10-01T10:00:00Z") / 1000);
});

Deno.test("an offline channel is Offline, your own shows the lurk phrase", () => {
  assertEquals(buildPresence(ctx(), session).stateText, "Offline");
  const own = buildPresence(ctx({ userId: "1" }), session);
  assertEquals(own.stateText, "Self-lurking");
  assertEquals(own.startedAt, 100);
});

Deno.test("long titles are cut without splitting an emoji", () => {
  const title = "a".repeat(126) + "😀" + "tail";
  const { largeText } = buildPresence(
    ctx({ liveStreams: [stream({ title })] }),
    session,
  );
  assertEquals(largeText, "a".repeat(126) + "…");
  assertEquals(largeText!.length <= 128, true);
});
