import { and, eq, inArray } from "drizzle-orm";
import type { Identity } from "../auth/twitch.ts";
import type { Db } from "../db/client.ts";
import { connections, type Provider, type User, users } from "../db/schema.ts";

export type UsersRepo = {
  upsert(identity: Identity): Promise<User>;
  known(provider: Provider, providerIds: string[]): Promise<string[]>;
};

const D1_PARAMS_PER_QUERY = 90;

function isUniqueViolation(err: unknown): boolean {
  return String(err).includes("UNIQUE constraint failed");
}

export function usersRepo(db: Db): UsersRepo {
  async function find(
    { provider, providerId }: Identity,
  ): Promise<User | undefined> {
    const [row] = await db
      .select({ user: users })
      .from(connections)
      .innerJoin(users, eq(connections.userId, users.id))
      .where(
        and(
          eq(connections.provider, provider),
          eq(connections.providerId, providerId),
        ),
      );
    return row?.user;
  }

  async function create(identity: Identity): Promise<User> {
    const id = crypto.randomUUID();
    const [[user]] = await db.batch([
      db.insert(users).values({ id }).returning(),
      db.insert(connections).values({ ...identity, userId: id }),
    ]);
    return user;
  }

  async function touch(user: User): Promise<User> {
    const [touched] = await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();
    return touched;
  }

  return {
    async upsert(identity) {
      const existing = await find(identity);
      if (existing) return touch(existing);
      try {
        return await create(identity);
      } catch (err) {
        const lostFirstLoginRace = isUniqueViolation(err);
        if (lostFirstLoginRace) return touch((await find(identity))!);
        throw err;
      }
    },
    async known(provider, providerIds) {
      const found: string[] = [];
      for (let i = 0; i < providerIds.length; i += D1_PARAMS_PER_QUERY) {
        const rows = await db
          .select({ providerId: connections.providerId })
          .from(connections)
          .where(
            and(
              eq(connections.provider, provider),
              inArray(
                connections.providerId,
                providerIds.slice(i, i + D1_PARAMS_PER_QUERY),
              ),
            ),
          );
        found.push(...rows.map((r) => r.providerId));
      }
      return found;
    },
  };
}
