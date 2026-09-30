import { cacheUsers, pendingUserById, userCache } from "../../stores/users.ts";
import { commands } from "../../bindings.ts";
import type { GetUsersParams, User } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export type { User } from "../../types/index.ts";

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
      const promise = invokeCommand(
        commands.getUsers,
        [{ ids: toFetch }],
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
  const result = await invokeCommand(commands.getUsers, [params], options);
  cacheUsers(result);
  return result;
}
