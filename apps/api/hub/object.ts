import { DurableObject } from "cloudflare:workers";
import type { Identity } from "../auth/twitch.ts";
import type { Bindings } from "../config.ts";
import { presence } from "../presence/module.ts";
import { createHubDb, migrateHubDb } from "./db.ts";
import type { Feature, Hub as HubApi, Session } from "./feature.ts";
import {
  envelope,
  HUB_FEATURE,
  IDENTITY_HEADER,
  parseEnvelope,
} from "./protocol.ts";

const FEATURES: Feature[] = [presence];

if (FEATURES.some((f) => f.name === HUB_FEATURE)) {
  throw new Error(`"${HUB_FEATURE}" is reserved for the hub itself`);
}

const userTag = (id: string) => `u:${id}`;
const socketTag = (id: string) => `s:${id}`;

export class Hub extends DurableObject<Bindings> {
  private readonly api: HubApi;

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
    const db = createHubDb(ctx.storage);
    this.api = {
      env,
      db,
      send: (ws, body) => send(ws, body),
      socketsOf: (twitchId) => ctx.getWebSockets(userTag(twitchId)),
      socket: (socketId) => ctx.getWebSockets(socketTag(socketId))[0],
    };
    ctx.blockConcurrencyWhile(() => migrateHubDb(db));
    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  override fetch(request: Request): Response {
    const identity = JSON.parse(
      request.headers.get(IDENTITY_HEADER)!,
    ) as Identity;
    const session: Session = { identity, socketId: crypto.randomUUID() };
    const { 0: client, 1: server } = new WebSocketPair();
    const first = this.api.socketsOf(identity.providerId).length === 0;
    this.ctx.acceptWebSocket(server, [
      userTag(identity.providerId),
      socketTag(session.socketId),
    ]);
    server.serializeAttachment(session);
    for (const feature of FEATURES) {
      feature.connect?.(this.api, server, session, first);
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const msg = parseEnvelope(raw);
    if (!msg) return;
    const feature = FEATURES.find((f) => f.name === msg.feature);
    if (!feature) return;
    const session = ws.deserializeAttachment() as Session;
    await feature.message(
      { ...this.api, send: (_, body) => send(ws, body, feature.name) },
      ws,
      session,
      msg.body,
    );
  }

  override webSocketClose(ws: WebSocket) {
    return this.disconnect(ws);
  }

  override webSocketError(ws: WebSocket) {
    return this.disconnect(ws);
  }

  private async disconnect(ws: WebSocket) {
    const session = ws.deserializeAttachment() as Session;
    const last = !this.api.socketsOf(session.identity.providerId)
      .some((other) => other !== ws);
    for (const feature of FEATURES) {
      await feature.disconnect?.(this.api, session, last);
    }
  }
}

function send(ws: WebSocket, body: Record<string, unknown>, feature?: string) {
  const text = feature ? envelope(feature, body) : JSON.stringify(body);
  try {
    ws.send(text);
  } catch {
    // Socket already closing; its close handler cleans up.
  }
}
