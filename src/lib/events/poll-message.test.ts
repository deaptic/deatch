/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawPoll } from "../types/twitch/eventsub.ts";
import { pollBegin, pollEnd } from "./poll-message.ts";

const poll = (p: Partial<RawPoll> = {}): RawPoll => ({
  broadcaster_user_id: "1",
  id: "p1",
  title: "Pizza?",
  choices: [
    { id: "a", title: "Yes", votes: 3 },
    { id: "b", title: "No", votes: 7 },
  ],
  started_at: "2026-10-01T00:00:00Z",
  ends_at: "2026-10-01T00:02:00Z",
  ...p,
});

Deno.test("lists the choices and how long a poll runs", () => {
  assertEquals(pollBegin(poll()), "Poll “Pizza?” started for 2m: Yes and No");
});

Deno.test("ranks the results, noting an early end", () => {
  assertEquals(
    pollEnd(poll({ status: "terminated" })),
    "Poll “Pizza?” ended early. Results: No 7 votes and Yes 3 votes",
  );
  assertEquals(pollEnd(poll({ status: "archived" })), null);
});
