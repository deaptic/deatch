import { feedUserShowDisplayName } from "../../lib/stores/preferences.ts";
import { knownChatterColor } from "../../lib/stores/users.ts";
import { nameColor } from "./nameColor.ts";
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

  return (
    <span
      class={`font-semibold text-(--name) ${userLinkHover(props)} ${
        props.truncate ? "truncate min-w-0" : ""
      }`}
      style={{ "--name": nameColor(known()) }}
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
