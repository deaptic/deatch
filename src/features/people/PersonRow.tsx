import { type JSX, Show } from "solid-js";
import type { UserRef } from "../../shared/types/index.ts";
import { ChatterPicture } from "../message/index.ts";
import ListRow from "../../kit/ListRow.tsx";
import Text from "../../kit/Text.tsx";

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
        size="xs"
        userId={props.user.id}
        name={props.user.displayName}
      />
      <span class="min-w-0 flex flex-col">
        <Text truncate size="md" tone="primary">
          {props.user.displayName}
        </Text>
        <Show when={props.detail}>
          <Text truncate size="sm" tone="faint">
            {props.detail}
          </Text>
        </Show>
      </span>
    </ListRow>
  );
}
