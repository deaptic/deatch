import { cacheUsers, pendingUserById, userCache } from "../state/users";
import { invokeCommand, type InvokeOptions } from "./utils";

export type GetUsersParams = {
  userIds?: string[];
  logins?: string[];
};
export type User = {
  id: string;
  login: string;
  display_name: string;
  type: "" | "admin" | "global_mod" | "staff" | null;
  broadcaster_type: "" | "affiliate" | "partner" | null;
  description: string | null;
  profile_image_url: string | null;
  offline_image_url: string | null;
  email: string | null;
  created_at: string;
};
export type GetUsersResponse = User[];

export async function getUsers(
  params: GetUsersParams = {},
  options?: InvokeOptions,
): Promise<GetUsersResponse> {
  const ids = params.userIds ?? [];
  const logins = params.logins ?? [];

  // Cache-first path: id-only lookups
  if (ids.length && logins.length === 0) {
    const cache = userCache();
    const toFetch = ids.filter((id) => !cache[id] && !pendingUserById.has(id));

    if (toFetch.length) {
      const promise = invokeCommand<GetUsersResponse>(
        "get_users",
        { userIds: toFetch },
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
  const result = await invokeCommand<GetUsersResponse>("get_users", params, options);
  cacheUsers(result);
  return result;
}
