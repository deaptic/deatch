import { expect, test } from "vite-plus/test";
import type { RawNotification } from "../types/index.ts";
import { mapNotice } from "./notice.ts";

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

test("takes the announcement colour the broadcaster picked", () => {
  const colored = (color: string) =>
    mapNotice(raw({ notice_type: "announcement", announcement: { color } }), 0)
      ?.announcement_color;
  expect(colored("PURPLE")).toBe("purple");
  expect(colored("green")).toBe("green");
  expect(colored("PRIMARY")).toBe("primary");
  expect(colored("teal")).toBeUndefined();
});

test("keeps the chatter's own text", () => {
  const item = mapNotice(
    raw({
      message: { text: "hi", fragments: [{ type: "text", text: "hi" }] },
    }),
    0,
  );
  expect(item?.message).toStrictEqual([{ type: "text", text: "hi" }]);
});
