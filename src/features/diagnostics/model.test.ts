import { expect, test } from "vite-plus/test";
import { countCache } from "./model.ts";

test("counts users, open channels and their messages", () => {
  const feeds = {
    a: { messages: [1, 2] },
    b: { messages: [3] },
    c: undefined,
  };
  expect(countCache(feeds, { viewer1: {}, viewer2: {} })).toEqual({
    users: 2,
    channels: 2,
    messages: 3,
  });
});
