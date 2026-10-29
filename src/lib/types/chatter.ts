export type Chatter = {
  id: string;
  login: string;
  displayName: string;
  color: string;
  lastSeen: number;
};

export type FollowStatus =
  | { kind: "unknown" }
  | { kind: "hidden" }
  | { kind: "none" }
  | { kind: "since"; at: string };
