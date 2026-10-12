import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const providers = ["twitch"] as const;
export type Provider = typeof providers[number];

const id = () => text().primaryKey().$defaultFn(() => crypto.randomUUID());
const timestamp = () =>
  integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: id(),
  createdAt: timestamp(),
  lastSeenAt: timestamp(),
});

export const connections = sqliteTable("connections", {
  id: id(),
  provider: text({ enum: providers }).notNull(),
  providerId: text().notNull(),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp(),
}, (t) => [
  uniqueIndex("connections_provider_provider_id").on(t.provider, t.providerId),
]);

export type User = typeof users.$inferSelect;
