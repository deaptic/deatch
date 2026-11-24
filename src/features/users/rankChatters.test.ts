import { expect, test } from "vite-plus/test";
import type { Chatter } from "./types.ts";
import { rankChatters } from "./rankChatters.ts";

const chatter = (login: string, displayName: string, lastSeen: number) =>
  ({ id: login, login, displayName, color: "", lastSeen }) satisfies Chatter;

test("matches login or display name, most recent first", () => {
  const ranked = rankChatters(
    [
      chatter("viewer1", "Viewer1", 1),
      chatter("viewer2", "Viewer2", 3),
      chatter("broadcaster", "視聴者", 2),
    ],
    "view",
  );
  expect(ranked.map((c) => c.login)).toStrictEqual(["viewer2", "viewer1"]);
});
