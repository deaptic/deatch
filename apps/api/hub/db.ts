import { drizzle } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import migrations from "../drizzle-hub/migrations.js";
import * as schema from "./schema.ts";

export type HubDb = ReturnType<typeof createHubDb>;

export function createHubDb(storage: DurableObjectStorage) {
  return drizzle(storage, { schema });
}

export function migrateHubDb(db: HubDb): Promise<void> {
  return migrate(db, migrations);
}
