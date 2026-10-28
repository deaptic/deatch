export function channelUrl(login: string): string {
  return `https://twitch.tv/${login}`;
}

export function clipUrl(id: string): string {
  return `https://clips.twitch.tv/${id}`;
}

/// Live chat sends Twitch emotes by id only; lists get theirs from the backend.
export function emoteUrl(id: string): string {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`;
}
