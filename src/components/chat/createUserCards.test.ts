/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { createUserCards } from "./createUserCards.ts";

const ids = (cards: { chatterId: string }[]) => cards.map((c) => c.chatterId);

Deno.test("opening a card replaces the unpinned one and keeps pinned ones", () => {
  const userCards = createUserCards();
  userCards.open(0, 0, "a");
  userCards.update(userCards.cards[0].key, { pinned: true });
  userCards.open(0, 0, "b");
  userCards.open(0, 0, "c");
  assertEquals(ids(userCards.cards), ["a", "c"]);
});

Deno.test("close removes only the given card", () => {
  const userCards = createUserCards();
  userCards.open(0, 0, "a");
  userCards.update(userCards.cards[0].key, { pinned: true });
  userCards.open(0, 0, "b");
  userCards.close(userCards.cards[0].key);
  assertEquals(ids(userCards.cards), ["b"]);
});
