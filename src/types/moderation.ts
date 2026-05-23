// EventSub: chat moderation (deletes / clears).
export type RawChatMessageDelete = {
  broadcaster_user_id: string;
  message_id: string;
  target_user_id: string;
  target_user_login: string;
  target_user_name: string;
};

export type RawChatClear = {
  broadcaster_user_id: string;
};

export type RawChatClearUserMessages = {
  broadcaster_user_id: string;
  target_user_id: string;
  target_user_login: string;
  target_user_name: string;
};

// EventSub: channel.moderate (mod-only, all moderator actions).
type RawModerateBase = {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  moderator_user_id: string;
  moderator_user_login: string;
  moderator_user_name: string;
};

type RawModUser = { user_id: string; user_login: string; user_name: string };

export type RawModerateEvent = {
  message_timestamp: string;
  event: RawModerate;
};

export type RawModerate = RawModerateBase &
  (
    | { action: "clear" }
    | { action: "ban"; ban: RawModUser & { reason: string | null } }
    | { action: "unban"; unban: RawModUser }
    | { action: "timeout"; timeout: RawModUser & { reason: string | null; expires_at: string } }
    | { action: "untimeout"; untimeout: RawModUser }
    | { action: "delete"; delete: RawModUser & { message_id: string; message_body: string } }
    | { action: "mod"; mod: RawModUser }
    | { action: "unmod"; unmod: RawModUser }
    | { action: "vip"; vip: RawModUser }
    | { action: "unvip"; unvip: RawModUser }
    | { action: "raid"; raid: RawModUser & { viewer_count: number } }
    | { action: "unraid"; unraid: RawModUser }
    | { action: "slow"; slow: { wait_time_seconds: number } }
    | { action: "slowoff" }
    | { action: "followers"; followers: { follow_duration_minutes: number } }
    | { action: "followersoff" }
    | { action: "emoteonly" }
    | { action: "emoteonlyoff" }
    | { action: "subscribers" }
    | { action: "subscribersoff" }
    | { action: "uniquechat" }
    | { action: "uniquechatoff" }
    | { action: "warn"; warn: RawModUser & { reason: string | null } }
  );

// EventSub: automod.message.hold v2.
export type AutomodHeldReason =
  | {
      reason: "automod";
      automod: { category: string; level: number; boosts_immunity: boolean };
    }
  | {
      reason: "blocked_term";
      blocked_term: {
        terms_found: { term_id: string; boundary: { start_pos: number; end_pos: number } }[];
      };
    };

type RawAutomodFragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; emote: { id: string; emote_set_id: string } }
  | {
      type: "cheermote";
      text: string;
      cheermote: { prefix: string; bits: number; tier: number };
    };

export type RawAutomodMessageHold = {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  user_id: string;
  user_login: string;
  user_name: string;
  message_id: string;
  message: { text: string; fragments: RawAutomodFragment[] };
  held_at: string;
} & AutomodHeldReason;
