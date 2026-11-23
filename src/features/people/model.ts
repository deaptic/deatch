import type { UserRef } from "../../lib/types/index.ts";

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

export function matchesPerson(user: UserRef, query: string): boolean {
  const q = query.trim().toLowerCase();
  return (
    !q || user.login.includes(q) || user.displayName.toLowerCase().includes(q)
  );
}

export function groupChatters(
  chatters: readonly UserRef[],
  roles: Roles,
  query: string,
): ChatterGroup[] {
  const byKind = new Map<ChatterGroupKind, UserRef[]>();
  for (const user of chatters) {
    if (!matchesPerson(user, query)) continue;
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
