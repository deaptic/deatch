import { cacheUsers, pendingUserById, userCache } from "../../state/users";
import type { User } from "../../types/twitch/user";
import { invokeCommand, type InvokeOptions } from "../utils";

export type { User } from "../../types/twitch/user";

export type GetUsersParams = {
  ids?: string[];
  logins?: string[];
};

export async function getUsers(
  params: GetUsersParams = {},
  options?: InvokeOptions,
): Promise<User[]> {
  const ids = params.ids ?? [];
  const logins = params.logins ?? [];

  // Cache-first path: id-only lookups
  if (ids.length && logins.length === 0) {
    const cache = userCache();
    const toFetch = ids.filter((id) => !cache[id] && !pendingUserById.has(id));

    if (toFetch.length) {
      const promise = invokeCommand<User[]>(
        "get_users",
        { ids: toFetch },
        options,
      )
        .then((users) => {
          cacheUsers(users);
        })
        .finally(() => {
          for (const id of toFetch) pendingUserById.delete(id);
        });
      for (const id of toFetch) pendingUserById.set(id, promise);
    }

    const inFlight = ids
      .map((id) => pendingUserById.get(id))
      .filter((p): p is Promise<void> => !!p);
    await Promise.allSettled(inFlight);

    const updated = userCache();
    return ids.map((id) => updated[id]).filter((u): u is User => !!u);
  }

  // Anything else (logins, mixed, empty) — pass through and cache the result.
  const result = await invokeCommand<User[]>("get_users", params, options);
  cacheUsers(result);
  return result;
}
