import { log } from "../../shared/log.ts";
import { dig, stringOrNull } from "../../shared/record.ts";
import type { Finder } from "./finder.ts";
import { query } from "./graphql.ts";

const userQuery = (login: string) =>
  query("ChannelId", { user: { args: { login }, select: { id: true } } });

export const readUserId = (data: unknown): string | null =>
  stringOrNull(dig(data, "user", "id"));

export function createChannelIds(finder: Finder) {
  const ids = new Map<string, string>();

  async function idOf(login: string): Promise<string | null> {
    const known = ids.get(login);
    if (known) return known;
    const client = finder.client();
    if (!client) return null;
    try {
      const result = await client.query({
        query: userQuery(login),
        fetchPolicy: "cache-first",
      });
      const id = readUserId(result.data);
      if (id) ids.set(login, id);
      return id;
    } catch (error) {
      log.warn("channel id not read", login, error);
      return null;
    }
  }

  return { idOf };
}
