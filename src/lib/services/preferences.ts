import { getUsers, type User } from "../api/twitch/users.ts";
import { addToast } from "../stores/toasts.ts";
import {
  feedUserMuted,
  muteUser,
  setUserNickname,
} from "../stores/preferences.ts";

export async function resolveUserByLogin(login: string): Promise<User | null> {
  const key = login.trim().toLowerCase();
  if (!key) return null;
  try {
    const users = await getUsers({ logins: [key] });
    const u = users[0];
    if (!u) {
      addToast(`User "${key}" not found`, "error");
      return null;
    }
    return u;
  } catch (e) {
    addToast(String(e), "error");
    return null;
  }
}

export async function muteUserByLogin(login: string): Promise<User | null> {
  const u = await resolveUserByLogin(login);
  if (!u || feedUserMuted().includes(u.id)) return null;
  muteUser(u.id);
  return u;
}

export async function setUserNicknameByLogin(
  login: string,
  nickname: string,
): Promise<User | null> {
  const u = await resolveUserByLogin(login);
  if (!u) return null;
  setUserNickname(u.login, nickname);
  return u;
}
