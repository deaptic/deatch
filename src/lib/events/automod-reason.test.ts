/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawAutomodMessageHold } from "../types/index.ts";
import { automodReason } from "./automod-reason.ts";

const base = {
  broadcaster_user_id: "1",
  broadcaster_user_login: "here",
  broadcaster_user_name: "Here",
  user_id: "2",
  user_login: "foo",
  user_name: "Foo",
  message_id: "m1",
  held_at: "2026-10-01T00:00:00Z",
};

const term = (start_pos: number, end_pos: number) => ({
  term_id: "t",
  boundary: { start_pos, end_pos },
});

Deno.test("quotes each blocked term once from the message", () => {
  const text = "😀 bad words bad";
  const p: RawAutomodMessageHold = {
    ...base,
    message: { text, fragments: [{ type: "text", text }] },
    reason: "blocked_term",
    blocked_term: { terms_found: [term(2, 4), term(6, 10), term(12, 14)] },
  };
  assertEquals(automodReason(p), "Blocked term: bad, words");
});

Deno.test("quotes a blocked link", () => {
  const text = "see evil.example";
  const p: RawAutomodMessageHold = {
    ...base,
    message: { text, fragments: [{ type: "text", text }] },
    reason: "blocked_link",
    blocked_term: { terms_found: [term(4, 15)] },
  };
  assertEquals(automodReason(p), "Blocked link: evil.example");
});

Deno.test("names the AutoMod category and level", () => {
  const p: RawAutomodMessageHold = {
    ...base,
    message: { text: "x", fragments: [] },
    reason: "automod",
    automod: { category: "swearing", level: 2 },
  };
  assertEquals(automodReason(p), "AutoMod: Swearing (level 2)");
});
