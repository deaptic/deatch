import { expect, test } from "vite-plus/test";
import type { EmoteSetUpdated } from "../../shared/types/index.ts";
import * as emoteSetUpdate from "./setUpdate.ts";
import { at } from "../../shared/at.ts";

const emote = (name: string) => ({ name, url: `https://cdn/${name}` });

const update = (overrides: Partial<EmoteSetUpdated>): EmoteSetUpdated => ({
  id: "set1",
  actor: "Viewer1",
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
  expect(at(next, 0).url).toBe("https://cdn/Old");
});

test("describes each change", () => {
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
    "Added the emote A",
    "Removed the emote B",
    "Renamed the emote C to D",
  ]);
});

test("credits Someone without an actor", () => {
  expect(emoteSetUpdate.actor(update({ actor: null }))).toBe("Someone");
});
