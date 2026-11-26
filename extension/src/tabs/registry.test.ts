import { expect, test } from "vite-plus/test";
import { createTabs } from "./registry.ts";

const tab = (
  id: number,
  channel: string,
  muted: boolean,
  lastAccessed = 0,
) => ({
  id,
  url: `https://www.twitch.tv/${channel}`,
  incognito: false,
  lastAccessed,
  mutedInfo: { muted },
});

test("a channel counts as muted only when all of its tabs are", () => {
  const tabs = createTabs();
  tabs.apply(tab(1, "broadcaster1", true));
  tabs.apply(tab(2, "broadcaster1", false));
  tabs.apply(tab(3, "broadcaster2", true));
  expect(tabs.summary().channels).toEqual([
    { login: "broadcaster1", muted: false },
    { login: "broadcaster2", muted: true },
  ]);
});

test("the current channel is the active tab, else the most recently focused", () => {
  const tabs = createTabs();
  tabs.apply(tab(1, "broadcaster1", false, 10));
  tabs.apply(tab(2, "broadcaster2", false, 20));
  expect(tabs.summary().current).toBe("broadcaster2");
  tabs.setActive(1);
  expect(tabs.summary().current).toBe("broadcaster1");
  tabs.remove(1);
  expect(tabs.summary().current).toBe("broadcaster2");
});

test("leaving Twitch or going incognito forgets the tab", () => {
  const tabs = createTabs();
  tabs.apply(tab(1, "broadcaster1", false));
  tabs.apply({ ...tab(1, "broadcaster1", false), url: "https://example.com/" });
  tabs.apply({ ...tab(2, "broadcaster2", false), incognito: true });
  expect(tabs.summary().channels).toEqual([]);
});
