# Deatch API

Hono on Cloudflare Workers, D1 for storage, one Durable Object (`Hub`) holding
every client WebSocket, with features (presence today) as modules inside it.
Callers authenticate with their Twitch user token; the API validates it against
Twitch and only accepts tokens issued to our client id. Profile data (login,
display name, avatar) is never stored — clients get it from Twitch.

A user is our own id; `connections` links it to platform accounts (`provider`,
`providerId`). Twitch is the only provider today; a second one is a new enum
value and a validator, not a schema redesign.

## Layout

- `main.ts` — Worker entry: builds the app once per isolate, exports the `Hub`
  Durable Object
- `app.ts` — `createApp(deps)`: routes and error shape, no IO of its own
- `config.ts` — binding types, fails fast on a missing client id
- `errors.ts` — `ApiError` and the JSON error shape
  `{ error: { code, message } }`
- `auth/` — Twitch token validation (cached per isolate) and `requireAuth`
- `db/` — Drizzle over D1, `schema.ts`; generated SQL in `drizzle/`
- `hub/db.ts` — Drizzle over the Hub's own SQLite (`durable-sqlite`); schema
  aggregated in `hub/schema.ts` from each feature's `schema.ts`, migrations
  bundled from `drizzle-hub/` and applied when the object starts
- `users/` — D1 queries: register on first sight, which ids are Deatch users
- `hub/` — the `Hub` Durable Object, the message envelope, the `Feature`
  contract
- `presence/` — the presence feature module, its message shapes, its `watch`
  table
- `wrangler.toml` — bindings: `DB` (D1), `HUB` (Durable Object), vars

## Routes

`/api/v1/health` and `/api/v1/health/ready` are public. Everything else under
`/api/v1` needs `Authorization: Bearer <twitch user token>`.

- `GET /api/v1/ws` — the one WebSocket per client. Every message both ways is
  `{ "feature": "<name>", ...body }`; the Hub routes by `feature`. The name
  `hub` is reserved for protocol-level messages and can never be a feature. Text
  `ping` is answered with `pong` without waking the object.

  **presence**: being connected is being online; the last socket closing marks
  you offline and bumps `lastSeenAt`. Send
  `{ feature: "presence", type: "subscribe", twitchIds: [...] }` (≤100) to get
  `{ feature: "presence", type: "presence", entries: [{ twitchId, state }] }`
  back and `{ feature: "presence", type: "update", twitchId, state }` pushed on
  every change. `state` is `online`, `offline` (a Deatch user not running the
  app) or `unknown` (not a Deatch user).

One Durable Object instance (`global`) holds every socket; shard by id hash when
it nears a few thousand concurrent connections.

## Run

```powershell
deno task db:migrate          # apply drizzle/ to the local D1
deno task dev                 # wrangler dev on :8000
deno task test
```

Settings are `[vars]` in `wrangler.toml`; there are no secrets.

## Deploy

Once: `deno run -A npm:wrangler d1 create deatch`, paste the id into
`wrangler.toml`, `deno run -A npm:wrangler login`.

Every release:

```powershell
deno task db:migrate:remote   # additive migrations only, never edit drizzle/ after it ran anywhere
deno task deploy
```

Rate limiting is a Cloudflare dashboard rule on the zone, not code. Logs are in
the Workers dashboard (observability is on in `wrangler.toml`).

## Adding an endpoint

One folder per feature (`presence/`): `repo.ts` holds the queries behind a small
interface, `routes.ts` the Hono sub-app; `app.ts` mounts it under `/api/v1` and
`main.ts` wires the D1 repo. Read the caller from `c.var.identity`. Throw
`ApiError` for anything the client should see. Define app tables in
`db/schema.ts` and object-local tables in the feature's `schema.ts` (re-exported
from `hub/schema.ts`); run `deno task db:generate`, commit what it writes to
`drizzle/` and `drizzle-hub/`. Both go through Drizzle; no raw SQL. Both SQLites
cap a statement at 100 bound parameters, so every `IN (...)` and bulk insert is
chunked (see `users/repo.ts`, `presence/module.ts`).
