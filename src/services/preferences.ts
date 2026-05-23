import { getUsers, type User } from "../commands/twitch/users";
import { addToast } from "../state/toasts";
import { feedUserMuted, muteUser, setUserNickname } from "../state/preferences";

async function resolveUser(login: string): Promise<User | null> {
  try {
    const users = await getUsers({ logins: [login] });
    const u = users[0];
    if (!u) {
      addToast(`User "${login}" not found`, "error");
      return null;
    }
    return u;
  } catch (e) {
    addToast(String(e), "error");
    return null;
  }
}

export async function muteUserByLogin(login: string): Promise<User | null> {
  const u = await resolveUser(login);
  if (!u || feedUserMuted().includes(u.id)) return null;
  muteUser(u.id);
  return u;
}

export async function setUserNicknameByLogin(
  login: string,
  nickname: string,
): Promise<User | null> {
  const key = login.trim().toLowerCase();
  if (!key) return null;
  const u = await resolveUser(key);
  if (!u) return null;
  setUserNickname(u.login, nickname);
  return u;
}
