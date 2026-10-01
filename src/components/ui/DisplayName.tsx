import { openUrl } from "@tauri-apps/plugin-opener";
import {
  feedUserNickname,
  feedUserOverrideNameColor,
  feedUserShowDisplayName,
} from "../../lib/stores/preferences.ts";
import { resolvedTheme } from "../../lib/stores/theme.ts";
import { readableColor } from "../../lib/utils/color.ts";
import type { UserRef } from "../../lib/types/index.ts";

type Props = {
  login: string;
  displayName: string;
  color?: string;
  userId?: string;
  truncate?: boolean;
  prefix?: string;
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

  const color = () =>
    feedUserOverrideNameColor() ||
    (props.color
      ? readableColor(props.color, resolvedTheme())
      : "var(--color-ink-soft)");

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
      {props.prefix}
      {text()}
    </span>
  );
}
