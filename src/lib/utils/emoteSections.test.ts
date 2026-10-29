import { expect, test } from "vite-plus/test";
import type { EmoteType, User, UserEmote } from "../types/index.ts";
import {
  channelSections,
  dedupeById,
  globalSections,
  usableIn,
} from "./emoteSections.ts";

const broadcaster: User = {
  id: "100",
  login: "maya",
  displayName: "Maya",
  profileImageUrl: "",
  offlineImageUrl: null,
  description: "",
  broadcasterType: "affiliate",
  createdAt: "",
};

const emote = (
  name: string,
  ownerId: string,
  emoteType: EmoteType = "subscriptions",
  id = name,
): UserEmote => ({
  id,
  name,
  url: `u/${name}`,
  emoteType,
  emoteSetId: "s",
  ownerId,
});

const none = { sevenTv: [], bttv: [], ffz: [] };
const ids = (sections: { id: string }[]) => sections.map((s) => s.id);

test("emotes the channel offers and every emoji are usable", () => {
  const usable = usableIn([
    { id: "s", label: "S", emotes: [{ name: "Kappa", url: "" }] },
  ]);
  const values = ["Kappa", "subOnly", "😀", "🇫🇮"];
  expect(values.filter(usable)).toStrictEqual(["Kappa", "😀", "🇫🇮"]);
});

test("dedupeById keeps the first emote of each id", () => {
  const list = [
    emote("a", "1", "subscriptions", "1"),
    emote("b", "1", "subscriptions", "1"),
  ];
  expect(dedupeById(list).map((e) => e.name)).toStrictEqual(["a"]);
});

test("the channel tab lists the broadcaster's emotes once, then its sets", () => {
  const sections = channelSections(
    broadcaster,
    [
      emote("zed", "100"),
      emote("abe", "100"),
      emote("abe", "100", "subscriptions", "2"),
    ],
    { ...none, ffz: [{ name: "ffz1", url: "" }] },
  );
  expect(ids(sections)).toStrictEqual(["twitch", "ffz-channel"]);
  expect(sections[0]?.emotes.map((e) => e.name)).toStrictEqual(["abe", "zed"]);
});

test("the channel tab has no Twitch section without a broadcaster", () => {
  expect(channelSections(null, [emote("a", "100")], none)).toStrictEqual([]);
});

test("the global tab groups subscriptions, leaving out the open channel", () => {
  const sections = globalSections(
    broadcaster,
    [emote("own", "100"), emote("sub", "200"), emote("follow", "", "follower")],
    [{ id: "g", name: "Kappa", url: "" }],
    { ...none, sevenTv: [{ name: "7", url: "" }] },
    (id) => (id === "200" ? "Bob" : undefined),
  );
  expect(sections.map((s) => s.label)).toStrictEqual([
    "Bob",
    "Twitch Global",
    "7TV",
  ]);
  expect(sections[1]?.emotes.map((e) => e.name)).toStrictEqual([
    "follow",
    "Kappa",
  ]);
});
