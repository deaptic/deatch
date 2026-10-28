import { expect, test } from "vite-plus/test";
import type { EmoteSetUpdated } from "../types/index.ts";
import * as emoteSetUpdate from "./emoteSetUpdate.ts";

const emote = (name: string) => ({ name, url: `https://cdn/${name}` });

const update = (overrides: Partial<EmoteSetUpdated>): EmoteSetUpdated => ({
  id: "set1",
  actor: "Foo",
  added: [],
  removed: [],
  renamed: [],
  ...overrides,
});

test("removes, renames, then appends added emotes", () => {
  const next = emoteSetUpdate.apply(
    [emote("Kek"), emote("Old"), emote("Pog")],
    update({
      added: [emote("New1")],
      removed: ["Kek"],
      renamed: [{ from: "Old", to: "Fresh" }],
    }),
  );
  expect(next.map((e) => e.name)).toStrictEqual(["Fresh", "Pog", "New1"]);
  expect(next[0].url).toBe("https://cdn/Old");
});

test("describes each change, crediting Someone without an actor", () => {
  expect(
    emoteSetUpdate.describe(
      update({
        actor: null,
        added: [emote("A")],
        removed: ["B"],
        renamed: [{ from: "C", to: "D" }],
      }),
    ),
  ).toStrictEqual([
    "Someone added 7TV emote A",
    "Someone removed 7TV emote B",
    "Someone renamed 7TV emote C to D",
  ]);
});
