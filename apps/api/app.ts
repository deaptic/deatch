import { Hono } from "hono";
import { type AuthEnv, requireAuth } from "./auth/middleware.ts";
import type { ValidateToken } from "./auth/twitch.ts";
import { notFound, onError } from "./errors.ts";
import { hubRoutes } from "./hub/routes.ts";
import type { UsersRepo } from "./users/repo.ts";

export type Deps = {
  validateToken: ValidateToken;
  ready: () => Promise<void>;
  users: UsersRepo;
};

export function createApp({ validateToken, ready, users }: Deps) {
  const app = new Hono<AuthEnv>();
  app.onError(onError);
  app.notFound(notFound);

  const v1 = new Hono<AuthEnv>();
  v1.get("/health", (c) => c.json({ ok: true }));
  v1.get("/health/ready", async (c) => {
    await ready();
    return c.json({ ok: true });
  });
  v1.use("/ws", requireAuth(validateToken));
  v1.route("/ws", hubRoutes(users));

  app.route("/api/v1", v1);
  return app;
}
