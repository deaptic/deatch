/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { createLimiter } from "./limiter.ts";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => resolve = r);
  return { promise, resolve };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

Deno.test("never runs more than the limit at once", async () => {
  const run = createLimiter(2);
  const gates = [deferred(), deferred(), deferred()];
  const started: number[] = [];
  gates.forEach((gate, i) =>
    run(() => {
      started.push(i);
      return gate.promise;
    })
  );
  assertEquals(started, [0, 1]);
  gates[0].resolve();
  await flush();
  assertEquals(started, [0, 1, 2]);
});

Deno.test("urgent tasks jump the queue", async () => {
  const run = createLimiter(1);
  const gate = deferred();
  const started: string[] = [];
  run(() => gate.promise);
  run(async () => {
    started.push("normal");
  });
  run(async () => {
    started.push("urgent");
  }, true);
  gate.resolve();
  await flush();
  assertEquals(started, ["urgent", "normal"]);
});

Deno.test("keeps going after a failing task", async () => {
  const run = createLimiter(1);
  const originalError = console.error;
  console.error = () => {};
  const done: string[] = [];
  try {
    run(() => Promise.reject(new Error("boom")));
    run(async () => {
      done.push("second");
    });
    await flush();
  } finally {
    console.error = originalError;
  }
  assertEquals(done, ["second"]);
});
