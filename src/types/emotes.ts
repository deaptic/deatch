export type GlobalEmote = {
  id: string;
  name: string;
  images: { url_1x: string; url_2x: string; url_4x: string };
  format: string[];
  scale: string[];
  theme_mode: string[];
};

export type UserEmote = {
  id: string;
  name: string;
  emote_type: string;
  owner_id: string | null;
};
