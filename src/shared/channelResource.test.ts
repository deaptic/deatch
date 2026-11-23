import { expect, test } from "vite-plus/test";
import { channelResource } from "./channelResource.ts";

const channel = { id: "1", login: "someone" };

test("fetches once per channel", async () => {
  let calls = 0;
  const resource = channelResource(
    async () => ++calls,
    () => true,
  );
  await resource.get(channel);
  await resource.get(channel);
  expect(calls).toBe(1);
});

test("shows the value only while the channel is current", async () => {
  const shown: number[] = [];
  const resource = channelResource(
    async () => 7,
    () => false,
  );
  resource.show(channel, (v) => shown.push(v));
  await resource.get(channel);
  expect(shown).toEqual([]);
});

test("a failed fetch is retried next time", async () => {
  let calls = 0;
  const resource = channelResource(
    async () => {
      calls++;
      if (calls === 1) throw new Error("down");
      return calls;
    },
    () => true,
  );
  await expect(resource.get(channel)).rejects.toThrow();
  expect(await resource.get(channel)).toBe(2);
});
