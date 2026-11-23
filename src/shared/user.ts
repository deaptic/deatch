import type { SearchChannel, User, UserRef } from "../lib/types/index.ts";

const USER_ID = /^\d+$/;

export function userFromSearch(channel: SearchChannel): User {
  return {
    ...userFromRef(channel.user),
    profileImageUrl: channel.profileImageUrl,
  };
}

export function userFromRef(ref: UserRef): User {
  return {
    id: ref.id,
    login: ref.login,
    displayName: ref.displayName,
    profileImageUrl: "",
    offlineImageUrl: null,
    description: "",
    broadcasterType: "normal",
    createdAt: "",
  };
}

export function isUserId(id: string): boolean {
  return USER_ID.test(id);
}
