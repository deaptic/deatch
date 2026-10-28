import { expect, test } from "vite-plus/test";
import type { Chatter } from "../types/index.ts";
import { rankChatters } from "./rankChatters.ts";

const chatter = (login: string, displayName: string, lastSeen: number) =>
  ({ id: login, login, displayName, color: "", lastSeen }) satisfies Chatter;

test("matches login or display name, most recent first", () => {
  const ranked = rankChatters(
    [
      chatter("kaz", "Kaz", 1),
      chatter("kazoo", "Kazoo", 3),
      chatter("bob", "カズ", 2),
    ],
    "ka",
  );
  expect(ranked.map((c) => c.login)).toStrictEqual(["kazoo", "kaz"]);
});
