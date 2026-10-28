export function channelUrl(login: string): string {
  return `https://twitch.tv/${login}`;
}

export function clipUrl(id: string): string {
  return `https://clips.twitch.tv/${id}`;
}

export function categoryUrl(name: string): string {
  return `https://www.twitch.tv/directory/game/${encodeURIComponent(name)}`;
}

/// Live chat sends Twitch emotes by id only; lists get theirs from the backend.
export function emoteUrl(id: string): string {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`;
}
