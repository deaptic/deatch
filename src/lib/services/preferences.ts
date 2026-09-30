import type { User } from "../types/index.ts";
import * as users from "./users.ts";
import { addToast } from "../stores/toasts.ts";
import { errorMessage } from "../utils/error.ts";
import { setUserNickname } from "../stores/preferences.ts";

export async function resolveUserByLogin(login: string): Promise<User | null> {
  const key = login.trim().toLowerCase();
  if (!key) return null;
  try {
    const [u] = await users.get({ logins: [key] });
    if (!u) {
      addToast(`User "${key}" not found`, "error");
      return null;
    }
    return u;
  } catch (e) {
    addToast(errorMessage(e), "error");
    return null;
  }
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
