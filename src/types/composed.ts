// Frontend-composed channel shape: a user reference plus optional live-stream
// fields when the channel is online. Not a backend DTO — built by combining
// `User`, `Stream`, and watched-channel data in `state/channels` and the menu.

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
