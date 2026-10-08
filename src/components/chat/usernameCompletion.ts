type Chatter = { login: string; displayName: string; lastSeen: number };

/// The name Twitch resolves as a mention: the display name only when it is
/// just a recased login, otherwise the login itself.
export function mentionName(c: Pick<Chatter, "login" | "displayName">) {
  return c.displayName.toLowerCase() === c.login ? c.displayName : c.login;
}

export function completions(chatters: Iterable<Chatter>, query: string) {
  const q = query.toLowerCase();
  return [...chatters]
    .filter((c) =>
      c.login.toLowerCase().startsWith(q) ||
      c.displayName.toLowerCase().startsWith(q)
    )
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .map(mentionName);
}
