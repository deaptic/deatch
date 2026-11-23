import type { AppStats } from "../../platform/bindings.ts";

export type CacheStats = {
  users: number;
  channels: number;
  messages: number;
};

export type Diagnostics = {
  app: AppStats;
  cache: CacheStats;
  jsHeapBytes: number | null;
};
