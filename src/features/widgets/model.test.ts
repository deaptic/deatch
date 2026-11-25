import { expect, test } from "vite-plus/test";
import type { FeedEntry, FeedEvent, FeedMessage } from "../feed/index.ts";
import {
  arrange,
  chatterIds,
  isExpired,
  streamEntries,
  withLeaving,
  withUser,
} from "./model.ts";

const message = (
  id: string,
  extra: Partial<FeedMessage> = {},
): FeedMessage => ({
  kind: "message",
  message_id: id,
  chatter_user_id: "u",
  chatter_login: "u",
  chatter_name: "U",
  color: "",
  fragments: [],
  badges: [],
  timestamp: 0,
  ...extra,
});

const event = (id: string): FeedEvent => ({
  kind: "event",
  id,
  notice_type: "raid",
  system_message: "",
  chatter_name: "U",
  color: "",
  timestamp: 0,
});

const all = { maxLines: 50, hideCommands: false, hiddenUsers: [] };

const ids = (entries: FeedEntry[]) =>
  entries.map((e) => (e.kind === "message" ? e.message_id : e.id));

test("keeps the newest messages up to the limit", () => {
  const entries = [message("a"), message("b"), message("c")];
  expect(ids(streamEntries(entries, { ...all, maxLines: 2 }))).toEqual([
    "b",
    "c",
  ]);
});

test("shows plain chat only: no events, held or deleted messages", () => {
  const held = message("held", {
    automod_hold: {
      reason: "",
      status: "pending",
      broadcaster_user_id: "b",
      mine: false,
    },
  });
  const entries = [
    event("raid"),
    held,
    message("gone", { deleted: true }),
    message("ok"),
  ];
  expect(ids(streamEntries(entries, all))).toEqual(["ok"]);
});

test("drops notes, replies and highlights from messages", () => {
  const busy = message("m", {
    first_message: true,
    cheer: { bits: 100 },
    channel_points: { kind: "highlight" },
    suspicious: {
      status: "active_monitoring",
      evasion: "unknown",
      bannedElsewhere: false,
    },
  });
  expect(streamEntries([busy], all)).toEqual([message("m")]);
});

test("lists each chatter once", () => {
  const messages = [
    message("a", { chatter_user_id: "1" }),
    message("b", { chatter_user_id: "2" }),
    message("c", { chatter_user_id: "1" }),
  ];
  expect(chatterIds(messages)).toEqual(["1", "2"]);
});

test("a message expires once it is older than the hide time", () => {
  expect(isExpired(99_000, 0)).toBe(false);
  expect(isExpired(14_999, 15_000)).toBe(false);
  expect(isExpired(15_000, 15_000)).toBe(true);
});

const keys = (shown: { row: { key: string }; leaving: boolean }[]) =>
  shown.map(({ row, leaving }) => (leaving ? `-${row.key}` : row.key));

test("removed rows stay in place as leaving while new rows join", () => {
  const before = [
    { row: { key: "a" }, leaving: false },
    { row: { key: "b" }, leaving: false },
    { row: { key: "c" }, leaving: false },
  ];
  const next = [{ key: "b" }, { key: "c" }, { key: "d" }];
  expect(keys(withLeaving(before, next))).toEqual(["-a", "b", "c", "d"]);
});

test("a row deleted mid-list leaves from its own spot", () => {
  const before = [
    { row: { key: "a" }, leaving: false },
    { row: { key: "b" }, leaving: false },
    { row: { key: "c" }, leaving: false },
  ];
  expect(keys(withLeaving(before, [{ key: "a" }, { key: "c" }]))).toEqual([
    "a",
    "-b",
    "c",
  ]);
});

const said = (id: string, text: string, login = "u") =>
  message(id, { chatter_login: login, fragments: [{ type: "text", text }] });

test("hides !commands when asked", () => {
  const entries = [
    said("a", "!lurk"),
    said("b", "  !uptime"),
    said("c", "hi !"),
  ];
  expect(ids(streamEntries(entries, all))).toEqual(["a", "b", "c"]);
  expect(ids(streamEntries(entries, { ...all, hideCommands: true }))).toEqual([
    "c",
  ]);
});

test("hides chosen users whatever the letter case", () => {
  const entries = [said("a", "hi", "Nightbot"), said("b", "hi", "user1")];
  expect(
    ids(streamEntries(entries, { ...all, hiddenUsers: ["nightbot"] })),
  ).toEqual(["b"]);
});

test("stores hidden users once, lower-case and without @", () => {
  expect(withUser([], " @Nightbot ")).toEqual(["nightbot"]);
  expect(withUser(["nightbot"], "NightBot")).toEqual(["nightbot"]);
  expect(withUser(["nightbot"], "  ")).toEqual(["nightbot"]);
});

const row = (key: string) => ({ key });
const keysOf = (rows: { key: string }[]) => rows.map((r) => r.key);

test("a leaving row keeps its spot while it fades out", () => {
  const { rows, leaving } = arrange(
    [row("a"), row("b")],
    new Map(),
    [row("b")],
    (key) => `spot-${key}`,
  );
  expect(keysOf(rows)).toEqual(["a", "b"]);
  expect([...leaving]).toEqual([["a", "spot-a"]]);
});

test("a row that comes back while fading is shown again", () => {
  const { rows, leaving } = arrange(
    [row("a"), row("b")],
    new Map([["a", "spot-a"]]),
    [row("a"), row("b")],
    () => "unused",
  );
  expect(keysOf(rows)).toEqual(["a", "b"]);
  expect(leaving.size).toBe(0);
});

test("a row leaves at once when it was never measured", () => {
  const { rows, leaving } = arrange(
    [row("a"), row("b")],
    new Map(),
    [row("b")],
    () => undefined,
  );
  expect(keysOf(rows)).toEqual(["b"]);
  expect(leaving.size).toBe(0);
});
