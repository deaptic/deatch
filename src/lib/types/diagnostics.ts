import type { AppStats } from "../bindings.ts";

export type CacheStats = {
  users: number;
  channels: number;
  messages: number;
};

export type Diagnostics = {
  app: AppStats;
  cache: CacheStats;
};
