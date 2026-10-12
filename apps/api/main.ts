import { createApp } from "./app.ts";
import { cached, twitchValidator } from "./auth/twitch.ts";
import { type Bindings, twitchClientId } from "./config.ts";
import { createDb } from "./db/client.ts";
import { usersRepo } from "./users/repo.ts";

export { Hub } from "./hub/object.ts";

let app: ReturnType<typeof createApp> | undefined;

function appFor(env: Bindings) {
  const db = createDb(env.DB);
  return createApp({
    validateToken: cached(twitchValidator(twitchClientId(env))),
    ready: async () => {
      await db.run("select 1");
    },
    users: usersRepo(db),
  });
}

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    app ??= appFor(env);
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Bindings>;
