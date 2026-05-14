export type GlobalEmote = {
  id: string;
  name: string;
  images: { url_1x: string; url_2x: string; url_4x: string };
  format: string[];
  scale: string[];
  theme_mode: string[];
};

export type ChannelEmote = {
  name: string;
  images: { url_1x: string };
};

export type UserEmote = {
  id: string;
  name: string;
  emote_type: string;
  owner_id: string | null;
};

// External services proxied through Rust (BTTV / FFZ / 7TV).
export type RustEmoteEntry = { name: string; url: string };

export type SevenTvChannelResult = {
  emotes: RustEmoteEntry[];
  emote_set_id: string | null;
};
