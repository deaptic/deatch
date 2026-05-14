import type { TwitchUser } from "../types";
import { getUsers } from "../commands/users";
import { addToast } from "../state/toasts";
import { feedUserMuted, muteUser, setUserNickname } from "../state/preferences";

/// Resolves a login to a Twitch user, then mutes by user id. Returns the
/// resolved user (so callers can hydrate display metadata) or null if the
/// login isn't found or the user is already muted.
export async function muteUserByLogin(login: string): Promise<TwitchUser | null> {
  try {
    const users = await getUsers({ logins: [login] });
    const u = users[0];
    if (!u) {
      addToast(`User "${login}" not found`, "error");
      return null;
    }
    if (feedUserMuted().includes(u.id)) return null;
    muteUser(u.id);
    return u;
  } catch (e) {
    addToast(String(e), "error");
    return null;
  }
}

/// Resolves a login to a Twitch user, then assigns a nickname. Returns the
/// resolved user or null on failure.
export async function setUserNicknameByLogin(
  login: string,
  nickname: string,
): Promise<TwitchUser | null> {
  const key = login.trim().toLowerCase();
  if (!key) return null;
  try {
    const users = await getUsers({ logins: [key] });
    const u = users[0];
    if (!u) {
      addToast(`User "${key}" not found`, "error");
      return null;
    }
    setUserNickname(u.login, nickname);
    return u;
  } catch (e) {
    addToast(String(e), "error");
    return null;
  }
}
