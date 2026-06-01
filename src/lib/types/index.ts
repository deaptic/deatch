// Backend DTO shapes (primary — match Rust dto/*).
export * from "./pagination.ts";
export * from "./twitch/index.ts";

// External services (BTTV/FFZ/7TV/robotty). Only the widely-shared
// `EmoteEntry` is re-exported here; the other shapes (`Delta`,
// `ChannelResult`, `RecentMessage`, robotty's Badge/Fragment) are imported
// from their explicit `./external/*` paths when needed.
export type { EmoteEntry } from "./external/emote.ts";

// `Channel` is a frontend-composed shape that lives next to its signal in
// `state/channels` — import it from there directly.

// Frontend feed (app-level rendering types).
export * from "./feed.ts";
