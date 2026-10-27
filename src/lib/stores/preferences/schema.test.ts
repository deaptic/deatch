/// <reference lib="deno.ns" />
import { assertEquals, assertExists } from "@std/assert";
import {
  DEFAULT_PREFERENCES,
  MAX_TRIGGER_COOLDOWN,
  MIN_TRIGGER_COOLDOWN,
  sanitize,
} from "./schema.ts";

Deno.test("anything that is not an object falls back to the defaults", () => {
  for (const raw of [null, undefined, "x", 42, []]) {
    assertEquals(sanitize(raw), sanitize({}));
  }
  assertEquals(sanitize({}).feed.density, DEFAULT_PREFERENCES.feed.density);
});

Deno.test("keeps valid values and replaces invalid ones field by field", () => {
  const prefs = sanitize({
    feed: {
      density: "comfortable",
      showTimestamp: "false",
      keywords: ["gg", " ", 3],
    },
    appearance: { theme: "neon", accent: " #ABCDEF " },
    menu: { channels: { pinned: ["1", 2, "3"] } },
  });
  assertEquals(prefs.feed.density, "comfortable");
  assertEquals(
    prefs.feed.showTimestamp,
    DEFAULT_PREFERENCES.feed.showTimestamp,
  );
  assertEquals(prefs.feed.keywords, ["gg"]);
  assertEquals(prefs.appearance.theme, DEFAULT_PREFERENCES.appearance.theme);
  assertEquals(prefs.appearance.accent, "#abcdef");
  assertEquals(prefs.menu.channels.pinned, ["1", "3"]);
});

Deno.test("hiding all badges keeps each category's own setting", () => {
  const prefs = sanitize({
    feed: { showBadges: false, badges: { vanity: { show: false } } },
  });
  assertEquals(prefs.feed.showBadges, false);
  assertEquals(prefs.feed.badges.vanity?.show, false);
  assertEquals(prefs.feed.badges.subscriber?.show, true);
  assertEquals(sanitize({}).feed.showBadges, true);
});

Deno.test("hiding all events keeps each kind's own setting", () => {
  const prefs = sanitize({
    feed: { showEvents: false, events: { raid: { show: false } } },
  });
  assertEquals(prefs.feed.showEvents, false);
  assertEquals(prefs.feed.events.raid?.show, false);
  assertEquals(prefs.feed.events.sub?.show, true);
  assertEquals(sanitize({}).feed.showEvents, true);
});

Deno.test("triggers without an id or phrase are dropped, the rest repaired", () => {
  const prefs = sanitize({
    triggers: [
      {
        id: "a",
        phrase: "hi",
        location: "nowhere",
        cooldown: 99999,
        action: "shout",
      },
      { id: "b", phrase: "yo", cooldown: "soon" },
      { phrase: "no id" },
      { id: "c" },
      null,
    ],
  });
  assertEquals(prefs.triggers.map((t) => t.id), ["a", "b"]);
  const [a, b] = prefs.triggers;
  assertEquals(a.location, "anywhere");
  assertEquals(a.cooldown, MAX_TRIGGER_COOLDOWN);
  assertEquals(a.action, "reply");
  assertEquals(a.enabled, true);
  assertEquals(b.cooldown, MIN_TRIGGER_COOLDOWN);
});

Deno.test("each result is independent of the defaults", () => {
  const first = sanitize({});
  const event = first.feed.events.message;
  assertExists(event);
  const shown = event.show;
  first.feed.keywords.push("edited");
  first.menu.channels.pinned.push("edited");
  event.show = !shown;

  const next = sanitize({});
  assertEquals(next.feed.keywords.includes("edited"), false);
  assertEquals(next.menu.channels.pinned.includes("edited"), false);
  assertEquals(next.feed.events.message?.show, shown);
});
