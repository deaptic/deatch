import { expect, test } from "vite-plus/test";
import { channelFocus, diffFocus } from "./channelFocus.ts";

const sources = {
  ownId: "me",
  pinnedIds: ["pinned"],
  warmedIds: ["warmed"],
  selectedId: "live1",
  liveIds: ["live1", "live2", "pinned"],
};

test("focuses own, pinned, warmed and selected; the rest is background", () => {
  expect(Object.fromEntries(channelFocus(sources))).toStrictEqual({
    me: "focused",
    pinned: "focused",
    warmed: "focused",
    live1: "focused",
    live2: "background",
  });
});

test("reports joins, leaves and promotions", () => {
  const prev = channelFocus(sources);
  const next = channelFocus({
    ...sources,
    selectedId: "live2",
    liveIds: ["live2", "live3"],
  });
  const diff = diffFocus(prev, next);
  expect(diff.added).toStrictEqual(["live3"]);
  expect(diff.removed).toStrictEqual(["live1"]);
  expect(diff.promoted).toStrictEqual(["live2"]);
  expect(diff.changed).toStrictEqual(true);
});

test("demotion alone still counts as a change", () => {
  const prev = channelFocus(sources);
  const next = channelFocus({ ...sources, selectedId: undefined });
  const diff = diffFocus(prev, next);
  expect(diff.added).toStrictEqual([]);
  expect(diff.removed).toStrictEqual([]);
  expect(diff.changed).toStrictEqual(true);
});

test("identical inputs are not a change", () => {
  const diff = diffFocus(channelFocus(sources), channelFocus(sources));
  expect(diff.changed).toStrictEqual(false);
});
