import { expect, test } from "vite-plus/test";
import { createUserCards } from "./createUserCards.ts";

const ids = (cards: { chatterId: string }[]) => cards.map((c) => c.chatterId);

test("opening a card replaces the unpinned one and keeps pinned ones", () => {
  const userCards = createUserCards();
  userCards.open(0, 0, "a");
  userCards.update(userCards.cards[0].key, { pinned: true });
  userCards.open(0, 0, "b");
  userCards.open(0, 0, "c");
  expect(ids(userCards.cards)).toStrictEqual(["a", "c"]);
});

test("close removes only the given card", () => {
  const userCards = createUserCards();
  userCards.open(0, 0, "a");
  userCards.update(userCards.cards[0].key, { pinned: true });
  userCards.open(0, 0, "b");
  userCards.close(userCards.cards[0].key);
  expect(ids(userCards.cards)).toStrictEqual(["b"]);
});
