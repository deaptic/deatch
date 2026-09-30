import { fetchUsers } from "../api/twitch/users.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { cacheUsers, userCache } from "../stores/users.ts";
import type { GetUsersParams, User } from "../types/index.ts";

const inFlightById = new Map<string, Promise<void>>();

export async function getUsers(
  params: GetUsersParams = {},
  options?: InvokeOptions,
): Promise<User[]> {
  const ids = params.ids ?? [];
  const logins = params.logins ?? [];
  if (ids.length && logins.length === 0) return getUsersById(ids, options);

  const users = await fetchUsers(params, options);
  cacheUsers(users);
  return users;
}

async function getUsersById(
  ids: string[],
  options?: InvokeOptions,
): Promise<User[]> {
  const cache = userCache();
  const missing = ids.filter((id) => !cache[id] && !inFlightById.has(id));

  if (missing.length) {
    const request = fetchUsers({ ids: missing }, options)
      .then(cacheUsers)
      .finally(() => {
        for (const id of missing) inFlightById.delete(id);
      });
    for (const id of missing) inFlightById.set(id, request);
  }

  const inFlight = ids
    .map((id) => inFlightById.get(id))
    .filter((p): p is Promise<void> => !!p);
  await Promise.allSettled(inFlight);

  const updated = userCache();
  return ids.map((id) => updated[id]).filter((u): u is User => !!u);
}
