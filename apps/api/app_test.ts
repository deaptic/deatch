import { assertEquals } from "@std/assert";
import { createApp, type Deps } from "./app.ts";
import type { Identity } from "./auth/twitch.ts";

const identity: Identity = { provider: "twitch", providerId: "42" };

const users: Deps["users"] = {
  upsert: () => Promise.reject(new Error("not used here")),
  known: () => Promise.resolve([]),
};

function testApp(overrides: Partial<Deps> = {}) {
  return createApp({
    validateToken: (token) =>
      Promise.resolve(
        token === "good" ? { identity, expiresInSeconds: 3600 } : null,
      ),
    ready: () => Promise.resolve(),
    users,
    ...overrides,
  });
}

type Json = { error: { code: string } };
const json = (res: Response) => res.json() as Promise<Json>;

Deno.test("health is public", async () => {
  const res = await testApp().request("/api/v1/health");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true });
});

Deno.test("ready reports a failing dependency as 500 without leaking it", async () => {
  const app = testApp({ ready: () => Promise.reject(new Error("db down")) });
  const res = await app.request("/api/v1/health/ready");
  assertEquals(res.status, 500);
  assertEquals(await res.json(), {
    error: { code: "internal", message: "internal error" },
  });
});

Deno.test("presence rejects a missing token", async () => {
  const res = await testApp().request("/api/v1/ws");
  assertEquals(res.status, 401);
  assertEquals((await json(res)).error.code, "unauthorized");
});

Deno.test("presence rejects an invalid token", async () => {
  const res = await testApp().request("/api/v1/ws", {
    headers: { Authorization: "Bearer bad" },
  });
  assertEquals(res.status, 401);
});

Deno.test("presence needs a websocket upgrade once authenticated", async () => {
  const res = await testApp().request("/api/v1/ws", {
    headers: { Authorization: "Bearer good" },
  });
  assertEquals(res.status, 426);
  assertEquals((await json(res)).error.code, "upgrade_required");
});

Deno.test("unknown routes are 404 json", async () => {
  const res = await testApp().request("/nope");
  assertEquals(res.status, 404);
  assertEquals((await json(res)).error.code, "not_found");
});
