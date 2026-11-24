import { expect, test } from "vite-plus/test";
import { joinLinkMentions } from "./linkMentions.ts";

test("a mention inside a link joins the link back together", () => {
  expect(
    joinLinkMentions([
      { type: "text", text: "Tiktok: https://www.tiktok.com/" },
      { type: "mention", text: "@_itsjulkku", user_login: "_itsjulkku" },
      { type: "text", text: "/video/1 hi" },
    ]),
  ).toStrictEqual([
    {
      type: "text",
      text: "Tiktok: https://www.tiktok.com/@_itsjulkku/video/1 hi",
    },
  ]);
});

test("a mention after a finished link stays a mention", () => {
  const fragments = [
    { type: "text" as const, text: "https://a.b/ " },
    { type: "mention" as const, text: "@friend", user_login: "friend" },
  ];
  expect(joinLinkMentions(fragments)).toStrictEqual(fragments);
});
