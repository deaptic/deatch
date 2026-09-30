/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { EmoteSetUpdated } from "../types/index.ts";
import {
  applyEmoteSetUpdate,
  describeEmoteSetUpdate,
} from "./emoteSetUpdate.ts";

const emote = (name: string) => ({ name, url: `https://cdn/${name}` });

const update = (overrides: Partial<EmoteSetUpdated>): EmoteSetUpdated => ({
  id: "set1",
  actor: "Foo",
  added: [],
  removed: [],
  renamed: [],
  ...overrides,
});

Deno.test("removes, renames, then appends added emotes", () => {
  const next = applyEmoteSetUpdate(
    [emote("Kek"), emote("Old"), emote("Pog")],
    update({
      added: [emote("New1")],
      removed: ["Kek"],
      renamed: [{ from: "Old", to: "Fresh" }],
    }),
  );
  assertEquals(next.map((e) => e.name), ["Fresh", "Pog", "New1"]);
  assertEquals(next[0].url, "https://cdn/Old");
});

Deno.test("describes each change, crediting Someone without an actor", () => {
  assertEquals(
    describeEmoteSetUpdate(
      update({
        actor: null,
        added: [emote("A")],
        removed: ["B"],
        renamed: [{ from: "C", to: "D" }],
      }),
    ),
    [
      "Someone added 7TV emote A",
      "Someone removed 7TV emote B",
      "Someone renamed 7TV emote C to D",
    ],
  );
});
