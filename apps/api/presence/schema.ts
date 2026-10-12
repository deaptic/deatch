import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const watch = sqliteTable("watch", {
  socketId: text().notNull(),
  twitchId: text().notNull(),
}, (t) => [primaryKey({ columns: [t.socketId, t.twitchId] })]);
