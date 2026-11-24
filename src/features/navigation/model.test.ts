import { expect, test } from "vite-plus/test";
import {
  channelOf,
  leavePage,
  openChannel,
  openPage,
  startNavigation,
  toggleSettings,
} from "./model.ts";

const a = { id: "a" };
const b = { id: "b" };

test("opening channels remembers the last one and Explore keeps it", () => {
  const nav = openPage(
    openChannel(openChannel(startNavigation(), a), b),
    "explore",
  );
  expect(nav.view).toBe("explore");
  expect(nav.last).toBe(b);
  expect(channelOf(nav.view)).toBeNull();
});

test("settings toggles back to where you were", () => {
  const onChannel = openChannel(startNavigation(), a);
  const inSettings = toggleSettings(onChannel);
  expect(inSettings.view).toBe("settings");
  expect(toggleSettings(inSettings).view).toBe(a);
});

test("leaving a page goes back from settings, then from Explore to the last channel", () => {
  const nav = toggleSettings(
    openPage(openChannel(startNavigation(), a), "explore"),
  );
  const back = leavePage(nav);
  expect(back?.view).toBe("explore");
  expect(back && leavePage(back)?.view).toBe(a);
  expect(leavePage(openChannel(startNavigation(), a))).toBeNull();
  expect(leavePage(startNavigation())).toBeNull();
});

test("whispers is a page like Explore: leaving it returns to the last channel", () => {
  const nav = openPage(openChannel(startNavigation(), a), "whispers");
  expect(channelOf(nav.view)).toBeNull();
  expect(leavePage(nav)?.view).toBe(a);
});
