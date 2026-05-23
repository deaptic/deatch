// Backend DTO shapes (primary — match Rust dto/*).
export * from "./pagination";
export * from "./twitch";

// External services (BTTV/FFZ/7TV/robotty). Only the widely-shared
// `EmoteEntry` is re-exported here; the other shapes (`Delta`,
// `ChannelResult`, `RecentMessage`, robotty's Badge/Fragment) are imported
// from their explicit `./external/*` paths when needed.
export type { EmoteEntry } from "./external/emote";

// Frontend composed/derived shape (Channel = user info ∪ optional live
// stream fields — used by the menu and channel state).
export type { Channel } from "./composed";

// Frontend feed (app-level rendering types).
export * from "./feed";
