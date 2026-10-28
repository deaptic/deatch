import { expect, test } from "vite-plus/test";
import type { RawNotification } from "../types/index.ts";
import { mapNotice } from "./notice-mapper.ts";

const raw = (n: Partial<RawNotification>): RawNotification => ({
  broadcaster_user_id: "1",
  message_id: "n1",
  notice_type: "unknown",
  system_message: "from twitch",
  chatter_user_name: "Viewer",
  ...n,
});

test("keys a notice by Twitch's message id", () => {
  expect(mapNotice(raw({}), 0)?.id).toStrictEqual("n1");
});

test("drops a notice with nothing to show", () => {
  expect(mapNotice(raw({ system_message: " " }), 0)).toStrictEqual(null);
});

test("takes the announcement colour the broadcaster picked", () => {
  const colored = (color: string) =>
    mapNotice(raw({ notice_type: "announcement", announcement: { color } }), 0)
      ?.announcement_color;
  expect(colored("PURPLE")).toStrictEqual("purple");
  expect(colored("green")).toStrictEqual("green");
  expect(colored("PRIMARY")).toStrictEqual("primary");
  expect(colored("teal")).toStrictEqual(undefined);
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
