// Newtype wrappers in Rust serialize transparently as bare strings.
// Aliases here keep TS readable without adding cast friction.
export type UserId = string;
export type StreamId = string;
export type GameId = string;
