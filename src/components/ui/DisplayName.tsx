import {
  feedUserOverrideNameColor,
  feedUserShowDisplayName,
} from "../../lib/stores/preferences.ts";
import { resolvedTheme } from "../../lib/stores/theme.ts";
import { knownChatterColor } from "../../lib/stores/users.ts";
import { readableColor } from "../../lib/utils/color.ts";
import { type UserActions, userLink, userLinkHover } from "./userLink.ts";

type Props = UserActions & {
  login: string;
  displayName: string;
  color?: string;
  userId?: string;
  truncate?: boolean;
  prefix?: string;
};

export default function DisplayName(props: Props) {
  const text = () =>
    feedUserShowDisplayName() === false ? props.login : props.displayName;

  // Without a colour of its own, the name wears the one we last saw them use.
  const known = () =>
    props.color || (props.userId ? knownChatterColor(props.userId) : "");

  const color = () => {
    const override = feedUserOverrideNameColor();
    if (override) return override;
    const own = known();
    return own ? readableColor(own, resolvedTheme()) : "var(--color-ink-soft)";
  };

  return (
    <span
      class={`font-semibold text-(--name) ${userLinkHover(props)} ${
        props.truncate ? "truncate min-w-0" : ""
      }`}
      style={{ "--name": color() }}
      {...userLink(
        () => ({
          id: props.userId,
          login: props.login,
          displayName: props.displayName,
        }),
        props,
      )}
    >
      {props.prefix}
      {text()}
    </span>
  );
}
