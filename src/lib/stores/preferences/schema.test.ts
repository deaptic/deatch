import { assert, expect, test } from "vite-plus/test";
import {
  DEFAULT_PREFERENCES,
  MAX_TRIGGER_COOLDOWN,
  MIN_TRIGGER_COOLDOWN,
  sanitize,
} from "./schema.ts";
import { at } from "../../utils/at.ts";

test("anything that is not an object falls back to the defaults", () => {
  for (const raw of [null, undefined, "x", 42, []]) {
    expect(sanitize(raw)).toStrictEqual(sanitize({}));
  }
  expect(sanitize({}).feed.density).toStrictEqual(
    DEFAULT_PREFERENCES.feed.density,
  );
});

test("keeps valid values and replaces invalid ones field by field", () => {
  const prefs = sanitize({
    feed: {
      density: "comfortable",
      showTimestamp: "false",
      keywords: ["gg", " ", 3],
    },
    appearance: { theme: "neon", accent: " #ABCDEF " },
    menu: { channels: { pinned: ["1", 2, "3"] } },
  });
  expect(prefs.feed.density).toBe("comfortable");
  expect(prefs.feed.showTimestamp).toStrictEqual(
    DEFAULT_PREFERENCES.feed.showTimestamp,
  );
  expect(prefs.feed.keywords).toStrictEqual(["gg"]);
  expect(prefs.appearance.theme).toStrictEqual(
    DEFAULT_PREFERENCES.appearance.theme,
  );
  expect(prefs.appearance.accent).toBe("#abcdef");
  expect(prefs.menu.channels.pinned).toStrictEqual(["1", "3"]);
});

test("hiding all badges keeps each category's own setting", () => {
  const prefs = sanitize({
    feed: { showBadges: false, badges: { vanity: { show: false } } },
  });
  expect(prefs.feed.showBadges).toBe(false);
  expect(prefs.feed.badges.vanity.show).toBe(false);
  expect(prefs.feed.badges.subscriber.show).toBe(true);
  expect(sanitize({}).feed.showBadges).toBe(true);
});

test("hiding all events keeps each kind's own setting", () => {
  const prefs = sanitize({
    feed: { showEvents: false, events: { raid: { show: false } } },
  });
  expect(prefs.feed.showEvents).toBe(false);
  expect(prefs.feed.events.raid.show).toBe(false);
  expect(prefs.feed.events.sub.show).toBe(true);
  expect(sanitize({}).feed.showEvents).toBe(true);
});
test("event and badge settings keep only known keys with a boolean show", () => {
  const prefs = sanitize({
    feed: {
      events: {
        raid: { show: "no" },
        follow: { show: false },
        bogus: { show: false },
      },
      badges: { vanity: null, channel: { show: false } },
    },
  });
  expect(prefs.feed.events.raid.show).toBe(true);
  expect(prefs.feed.events.follow.show).toBe(false);
  expect("bogus" in prefs.feed.events).toBe(false);
  expect(prefs.feed.badges.vanity.show).toBe(true);
  expect(prefs.feed.badges.channel.show).toBe(false);
});

test("triggers without an id or phrase are dropped, the rest repaired", () => {
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
  expect(prefs.triggers.map((t) => t.id)).toStrictEqual(["a", "b"]);
  const a = at(prefs.triggers, 0);
  const b = at(prefs.triggers, 1);
  expect(a.location).toBe("anywhere");
  expect(a.cooldown).toStrictEqual(MAX_TRIGGER_COOLDOWN);
  expect(a.action).toBe("reply");
  expect(a.enabled).toBe(true);
  expect(b.cooldown).toStrictEqual(MIN_TRIGGER_COOLDOWN);
});

test("each result is independent of the defaults", () => {
  const first = sanitize({});
  const event = first.feed.events.message;
  assert.exists(event);
  const shown = event.show;
  first.feed.keywords.push("edited");
  first.menu.channels.pinned.push("edited");
  event.show = !shown;

  const next = sanitize({});
  expect(next.feed.keywords.includes("edited")).toBe(false);
  expect(next.menu.channels.pinned.includes("edited")).toBe(false);
  expect(next.feed.events.message.show).toStrictEqual(shown);
});
