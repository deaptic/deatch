export type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string | null;
};

export type TwitchStream = {
  user_id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string;
  started_at: string;
};

export type Channel = {
  user_id: string;
  user_login: string;
  user_name: string;
  profile_image_url: string;
  game_name?: string;
  viewer_count?: number;
  title?: string;
  thumbnail_url?: string;
  started_at?: string;
};

export type ModeratedChannel = {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
};
