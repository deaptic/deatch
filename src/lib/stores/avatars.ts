import { createSignal } from "solid-js";

const [byUser, setByUser] = createSignal<Record<string, string>>({});

export function avatarFor(userId: string): string | undefined {
  return byUser()[userId];
}

export function setAvatars(avatars: Record<string, string>) {
  setByUser((prev) => ({ ...prev, ...avatars }));
}
