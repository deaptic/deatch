import { expect, test } from "vite-plus/test";
import { orderChannels } from "./channelOrder.ts";
import { userFromRef } from "./knownUsers.ts";

const stream = (id: string) => ({ user: { id, login: id, displayName: id } });
const known = (ids: string[]) => (id: string) =>
  ids.includes(id)
    ? userFromRef({ id, login: id, displayName: id })
    : undefined;
const order = (sources: Partial<Parameters<typeof orderChannels>[0]>) =>
  orderChannels({
    pinnedIds: [],
    tabIds: new Set(),
    streams: [],
    knownUser: () => undefined,
    ...sources,
  }).map((u) => u.id);

test("pinned channels come first, then live ones, each once", () => {
  expect(
    order({
      pinnedIds: ["p1", "live1"],
      streams: [stream("live2"), stream("live1")],
      knownUser: known(["p1"]),
    }),
  ).toStrictEqual(["p1", "live1", "live2"]);
});

test("channels with a browser tab are left out", () => {
  expect(
    order({ streams: [stream("a"), stream("b")], tabIds: new Set(["a"]) }),
  ).toStrictEqual(["b"]);
});

test("a pinned channel not yet looked up shows only while live", () => {
  expect(order({ pinnedIds: ["gone"] })).toStrictEqual([]);
});
