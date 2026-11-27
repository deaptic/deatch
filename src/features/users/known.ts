import { createStore } from "solid-js/store";
import type { User } from "../../shared/types/index.ts";
import type { KnownUser } from "./model.ts";

export const [knownUsers, setKnownUsers] = createStore<
  Record<string, KnownUser>
>({});

export function knownUser(id: string): User | undefined {
  return knownUsers[id]?.user;
}

export function knownUserByLogin(login: string): User | undefined {
  return Object.values(knownUsers).find((known) => known.user.login === login)
    ?.user;
}
