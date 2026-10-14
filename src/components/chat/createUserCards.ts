import { createStore } from "solid-js/store";

export type OpenUserCard = {
  key: number;
  x: number;
  y: number;
  chatterId: string;
  pinned: boolean;
};

/** Pinned cards stay open; opening another card replaces only the unpinned one. */
export function createUserCards() {
  const [cards, setCards] = createStore<OpenUserCard[]>([]);
  let nextKey = 0;

  function open(x: number, y: number, chatterId: string) {
    setCards((all) => [
      ...all.filter((c) => c.pinned),
      { key: nextKey++, x, y, chatterId, pinned: false },
    ]);
  }

  function close(key: number) {
    setCards((all) => all.filter((c) => c.key !== key));
  }

  function update(key: number, patch: Partial<Omit<OpenUserCard, "key">>) {
    setCards((c) => c.key === key, patch);
  }

  return { cards, open, close, update };
}
