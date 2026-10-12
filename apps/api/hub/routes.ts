import { Hono } from "hono";
import type { AuthEnv } from "../auth/middleware.ts";
import type { Bindings } from "../config.ts";
import { ApiError } from "../errors.ts";
import type { UsersRepo } from "../users/repo.ts";
import { IDENTITY_HEADER } from "./protocol.ts";

export function hubRoutes(users: UsersRepo) {
  return new Hono<AuthEnv & { Bindings: Bindings }>()
    .get("/", async (c) => {
      if (c.req.header("Upgrade") !== "websocket") {
        throw new ApiError(426, "upgrade_required", "websocket only");
      }
      await users.upsert(c.var.identity);
      const stub = c.env.HUB.get(c.env.HUB.idFromName("global"));
      const headers = new Headers(c.req.raw.headers);
      headers.set(IDENTITY_HEADER, JSON.stringify(c.var.identity));
      return stub.fetch(c.req.raw.url, { headers });
    });
}
