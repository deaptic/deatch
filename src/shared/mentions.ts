export const MENTION_KINDS = ["reply", "mention", "keyword"] as const;
export type MentionKind = (typeof MENTION_KINDS)[number];
