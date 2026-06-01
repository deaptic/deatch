import { openUrl } from "@tauri-apps/plugin-opener";
import {
  feedUserNickname,
  feedUserOverrideNameColor,
  feedUserShowDisplayName,
} from "../../lib/stores/preferences.ts";

export type UserIdentity = {
  userId?: string;
  login: string;
  displayName: string;
};

type Props = {
  login: string;
  displayName: string;
  color?: string;
  userId?: string;
  class?: string;
  onShowUserCard?: (x: number, y: number, id: UserIdentity) => void;
  onUserContextMenu?: (x: number, y: number, id: UserIdentity) => void;
};

export default function DisplayName(props: Props) {
  const id = (): UserIdentity => ({
    userId: props.userId,
    login: props.login,
    displayName: props.displayName,
  });

  const text = () =>
    feedUserNickname(props.login) ??
      (feedUserShowDisplayName() === false ? props.login : props.displayName);

  const color = () =>
    feedUserOverrideNameColor() ||
    (props.color
      ? `oklch(from ${props.color} max(l, 0.65) c h)`
      : "var(--color-primary)");

  return (
    <span
      class={`font-semibold ${
        props.onShowUserCard ? "cursor-pointer hover:underline" : ""
      } ${props.class ?? ""}`}
      style={{ color: color() }}
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
