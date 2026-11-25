import { type JSX, Show } from "solid-js";
import type { UserRef } from "../../shared/types/index.ts";
import { ChatterPicture } from "../message/index.ts";
import ListRow from "../../kit/ListRow.tsx";

type Props = {
  user: UserRef;
  detail?: string;
  action?: JSX.Element;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function PersonRow(props: Props) {
  return (
    <ListRow
      actions={props.action}
      onClick={(e) => props.onShowUserCard(e.clientX, e.clientY, props.user)}
      onContextMenu={(e) =>
        props.onUserContextMenu(e.clientX, e.clientY, props.user)
      }
    >
      <ChatterPicture
        size={24}
        userId={props.user.id}
        name={props.user.displayName}
      />
      <span class="min-w-0 flex flex-col">
        <span class="truncate text-body text-ink">
          {props.user.displayName}
        </span>
        <Show when={props.detail}>
          <span class="truncate text-small text-ink-faint">{props.detail}</span>
        </Show>
      </span>
    </ListRow>
  );
}
