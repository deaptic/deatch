import { expect, test } from "vite-plus/test";
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

test("lists the choices and how long a poll runs", () => {
  expect(pollBegin(poll())).toStrictEqual({
    text: "Poll “Pizza?” started for 2m",
    detail: "Choices: Yes and No",
  });
});

test("ranks the results, noting an early end", () => {
  expect(pollEnd(poll({ status: "terminated" }))).toStrictEqual({
    text: "Poll “Pizza?” ended early",
    detail: "Results: No 7 votes and Yes 3 votes",
  });
  expect(pollEnd(poll({ status: "archived" }))).toStrictEqual(null);
});
