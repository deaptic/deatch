// @vitest-environment happy-dom
import { beforeEach, expect, test } from "vite-plus/test";
import { setStreamerMode, streamerMode } from "../preferences/index.ts";
import { streamEnded, streamStarted, turnOff } from "./store.ts";

beforeEach(() => {
  turnOff();
});

test("going live turns it on and ending the stream turns it back off", () => {
  streamStarted();
  expect(streamerMode()).toBe(true);
  streamEnded();
  expect(streamerMode()).toBe(false);
});

test("a stream ending leaves it on when you turned it on yourself", () => {
  setStreamerMode(true);
  streamStarted();
  streamEnded();
  expect(streamerMode()).toBe(true);
});

test("turning it off mid-stream keeps it off when the stream ends", () => {
  streamStarted();
  turnOff();
  streamEnded();
  expect(streamerMode()).toBe(false);
});
