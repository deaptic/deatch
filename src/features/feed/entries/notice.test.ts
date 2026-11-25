import { expect, test } from "vite-plus/test";
import type { RawNotification } from "../../../platform/twitch/eventsubPayloads.ts";
import { mapNotice } from "./notice.ts";

const hi = { text: "hi", fragments: [{ type: "text" as const, text: "hi" }] };

const raw = (n: Partial<RawNotification>): RawNotification => ({
  broadcaster_user_id: "1",
  message_id: "n1",
  notice_type: "unknown",
  system_message: "from twitch",
  chatter_user_name: "Viewer",
  ...n,
});

test("keys a notice by Twitch's message id", () => {
  expect(mapNotice(raw({}), 0)?.id).toBe("n1");
});

test("drops a notice with nothing to show", () => {
  expect(mapNotice(raw({ system_message: " " }), 0)).toBeNull();
});

test("keeps an announcement that has only its own words", () => {
  const item = mapNotice(
    raw({ notice_type: "announcement", system_message: "", message: hi }),
    0,
  );
  expect(item?.system_message).toBe("");
  expect(item?.chatter_name).toBe("Viewer");
});

test("credits an anonymous gifter as the author", () => {
  const item = mapNotice(
    raw({ chatter_is_anonymous: true, chatter_user_id: "5" }),
    0,
  );
  expect(item?.chatter_name).toBe("An anonymous gifter");
  expect(item?.chatter_user_id).toBeUndefined();
});

test("takes the announcement colour the broadcaster picked", () => {
  const colored = (color: string) =>
    mapNotice(
      raw({
        notice_type: "announcement",
        announcement: { color },
        message: hi,
      }),
      0,
    )?.announcement_color;
  expect(colored("PURPLE")).toBe("purple");
  expect(colored("green")).toBe("green");
  expect(colored("PRIMARY")).toBe("primary");
  expect(colored("teal")).toBeUndefined();
});

test("keeps the chatter's own text", () => {
  const item = mapNotice(raw({ message: hi }), 0);
  expect(item?.message).toStrictEqual([{ type: "text", text: "hi" }]);
});
