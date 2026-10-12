import type { Identity } from "../auth/twitch.ts";
import type { Bindings } from "../config.ts";
import type { HubDb } from "./db.ts";

export type Session = { identity: Identity; socketId: string };

export type Hub = {
  env: Bindings;
  db: HubDb;
  send(ws: WebSocket, body: Record<string, unknown>): void;
  socketsOf(twitchId: string): WebSocket[];
  socket(socketId: string): WebSocket | undefined;
};

export type Feature = {
  name: string;
  connect?(hub: Hub, ws: WebSocket, session: Session, first: boolean): void;
  message(
    hub: Hub,
    ws: WebSocket,
    session: Session,
    body: Record<string, unknown>,
  ): Promise<void> | void;
  disconnect?(
    hub: Hub,
    session: Session,
    last: boolean,
  ): Promise<void> | void;
};
