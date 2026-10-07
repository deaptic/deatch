/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { channelFocus, diffFocus } from "./channelFocus.ts";

const sources = {
  ownId: "me",
  pinnedIds: ["pinned"],
  warmedIds: ["warmed"],
  selectedId: "live1",
  liveIds: ["live1", "live2", "pinned"],
};

Deno.test("focuses own, pinned, warmed and selected; the rest is background", () => {
  assertEquals(
    Object.fromEntries(channelFocus(sources)),
    {
      me: "focused",
      pinned: "focused",
      warmed: "focused",
      live1: "focused",
      live2: "background",
    },
  );
});

Deno.test("reports joins, leaves and promotions", () => {
  const prev = channelFocus(sources);
  const next = channelFocus({
    ...sources,
    selectedId: "live2",
    liveIds: ["live2", "live3"],
  });
  const diff = diffFocus(prev, next);
  assertEquals(diff.added, ["live3"]);
  assertEquals(diff.removed, ["live1"]);
  assertEquals(diff.promoted, ["live2"]);
  assertEquals(diff.changed, true);
});

Deno.test("demotion alone still counts as a change", () => {
  const prev = channelFocus(sources);
  const next = channelFocus({ ...sources, selectedId: undefined });
  const diff = diffFocus(prev, next);
  assertEquals(diff.added, []);
  assertEquals(diff.removed, []);
  assertEquals(diff.changed, true);
});

Deno.test("identical inputs are not a change", () => {
  const diff = diffFocus(channelFocus(sources), channelFocus(sources));
  assertEquals(diff.changed, false);
});
