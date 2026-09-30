import { openUrl } from "@tauri-apps/plugin-opener";
import {
  feedUserNickname,
  feedUserOverrideNameColor,
  feedUserShowDisplayName,
} from "../../lib/stores/preferences.ts";
import { resolvedTheme } from "../../lib/stores/theme.ts";
import type { UserRef } from "../../lib/types/index.ts";

type Props = {
  login: string;
  displayName: string;
  color?: string;
  userId?: string;
  truncate?: boolean;
  onShowUserCard?: (x: number, y: number, id: Partial<UserRef>) => void;
  onUserContextMenu?: (x: number, y: number, id: Partial<UserRef>) => void;
};

export default function DisplayName(props: Props) {
  const id = (): Partial<UserRef> => ({
    id: props.userId,
    login: props.login,
    displayName: props.displayName,
  });

  const text = () =>
    feedUserNickname(props.login) ??
      (feedUserShowDisplayName() === false ? props.login : props.displayName);

  // Twitch name colours are chosen for one background; clamp lightness so
  // dark names stay readable on dark and light names on light.
  const color = () =>
    feedUserOverrideNameColor() ||
    (props.color
      ? resolvedTheme() === "dark"
        ? `oklch(from ${props.color} max(l, 0.64) c h)`
        : `oklch(from ${props.color} min(l, 0.58) c h)`
      : "var(--color-accent-ink)");

  return (
    <span
      class={`font-semibold text-(--name) ${
        props.onShowUserCard ? "cursor-pointer hover:underline" : ""
      } ${props.truncate ? "truncate min-w-0" : ""}`}
      style={{ "--name": color() }}
      onClick={(e) => props.onShowUserCard?.(e.clientX, e.clientY, id())}
      onContextMenu={(e) => {
        if (!props.onUserContextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        props.onUserContextMenu(e.clientX, e.clientY, id());
      }}
      onAuxClick={(e) => {
        if (e.button !== 1) return;
        e.preventDefault();
        openUrl(`https://twitch.tv/${props.login}`);
      }}
      onMouseDown={(e) => {
        if (e.button === 1) e.preventDefault();
      }}
    >
      {text()}
    </span>
  );
}
