import { expect, test } from "vite-plus/test";
import type { Category, Stream } from "../types/index.ts";
import { byViewers, matchingStreams } from "./liveFilter.ts";

const stream = (id: string, language: string, game: string, viewers: number) =>
  ({
    id,
    language,
    game: { id: game },
    viewerCount: viewers,
  }) as unknown as Stream;

const streams = [
  stream("a", "en", "1", 10),
  stream("b", "fi", "1", 30),
  stream("c", "en", "2", 20),
];

test("keeps streams in the language and category asked for", () => {
  const ids = (list: Stream[]) => list.map((s) => s.id);
  expect(ids(matchingStreams(streams, "", null))).toStrictEqual([
    "a",
    "b",
    "c",
  ]);
  expect(ids(matchingStreams(streams, "en", null))).toStrictEqual(["a", "c"]);
  const category = { id: "1" } as Category;
  expect(ids(matchingStreams(streams, "en", category))).toStrictEqual(["a"]);
});

test("orders by viewers, most first", () => {
  expect(byViewers(streams).map((s) => s.id)).toStrictEqual(["b", "c", "a"]);
});
