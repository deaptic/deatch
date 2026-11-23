import type { UserRef } from "../types/index.ts";

export type ChatterGroupKind =
  | "broadcaster"
  | "moderators"
  | "vips"
  | "viewers";

export type ChatterGroup = { kind: ChatterGroupKind; users: UserRef[] };

type Roles = {
  broadcasterId: string;
  moderators: ReadonlySet<string>;
  vips: ReadonlySet<string>;
};

const ORDER: ChatterGroupKind[] = [
  "broadcaster",
  "moderators",
  "vips",
  "viewers",
];

function kindOf(user: UserRef, roles: Roles): ChatterGroupKind {
  if (user.id === roles.broadcasterId) return "broadcaster";
  if (roles.moderators.has(user.id)) return "moderators";
  if (roles.vips.has(user.id)) return "vips";
  return "viewers";
}

function matches(user: UserRef, query: string): boolean {
  return (
    user.login.includes(query) || user.displayName.toLowerCase().includes(query)
  );
}

export function groupChatters(
  chatters: readonly UserRef[],
  roles: Roles,
  query: string,
): ChatterGroup[] {
  const q = query.trim().toLowerCase();
  const byKind = new Map<ChatterGroupKind, UserRef[]>();
  for (const user of chatters) {
    if (q && !matches(user, q)) continue;
    const kind = kindOf(user, roles);
    byKind.set(kind, [...(byKind.get(kind) ?? []), user]);
  }
  return ORDER.flatMap((kind) => {
    const users = byKind.get(kind);
    return users
      ? [{ kind, users: users.sort((a, b) => a.login.localeCompare(b.login)) }]
      : [];
  });
}
