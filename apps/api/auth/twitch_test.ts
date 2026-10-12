import { assertEquals, assertRejects } from "@std/assert";
import { cached, twitchValidator, type Validation } from "./twitch.ts";

function fakeFetch(status: number, body?: unknown): typeof fetch {
  return () =>
    Promise.resolve(new Response(JSON.stringify(body ?? {}), { status }));
}

const alice: Validation = {
  identity: { provider: "twitch", providerId: "42" },
  expiresInSeconds: 3600,
};

Deno.test("accepts a live token issued to our client id", async () => {
  const validate = twitchValidator(
    "ours",
    fakeFetch(200, { client_id: "ours", user_id: "42", expires_in: 3600 }),
  );
  assertEquals(await validate("t"), alice);
});

Deno.test("rejects a token issued to another client", async () => {
  const validate = twitchValidator(
    "ours",
    fakeFetch(200, { client_id: "theirs", user_id: "42", expires_in: 3600 }),
  );
  assertEquals(await validate("t"), null);
});

Deno.test("rejects an expired token", async () => {
  assertEquals(await twitchValidator("ours", fakeFetch(401))("t"), null);
});

Deno.test("surfaces a Twitch outage as an upstream error", async () => {
  await assertRejects(() => twitchValidator("ours", fakeFetch(503))("t"));
});

function counting(result: Validation | null) {
  let calls = 0;
  const validate = () => {
    calls++;
    return Promise.resolve(result);
  };
  return { validate, calls: () => calls };
}

Deno.test("cache serves repeat tokens without revalidating", async () => {
  const { validate, calls } = counting(alice);
  const c = cached(validate);
  await c("t");
  await c("t");
  assertEquals(calls(), 1);
});

Deno.test("cache does not remember failures", async () => {
  const { validate, calls } = counting(null);
  const c = cached(validate);
  await c("t");
  await c("t");
  assertEquals(calls(), 2);
});

Deno.test("cache never outlives the token itself", async () => {
  const { validate, calls } = counting({ ...alice, expiresInSeconds: 0 });
  const c = cached(validate, 60_000);
  await c("t");
  await c("t");
  assertEquals(calls(), 2);
});
