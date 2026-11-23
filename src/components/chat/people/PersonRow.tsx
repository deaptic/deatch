import { type JSX, Show } from "solid-js";
import type { UserRef } from "../../../lib/types/index.ts";
import ChatterPicture from "../../../features/message/ChatterPicture.tsx";

type Props = {
  user: UserRef;
  detail?: string;
  action?: JSX.Element;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function PersonRow(props: Props) {
  return (
    <div class="flex items-center gap-2 pr-1 rounded-sm hover:bg-raised">
      <button
        type="button"
        class="flex-1 min-w-0 min-h-9 flex items-center gap-2.5 px-2 py-1 text-left cursor-pointer"
        onClick={(e) => props.onShowUserCard(e.clientX, e.clientY, props.user)}
        onContextMenu={(e) => {
          e.preventDefault();
          props.onUserContextMenu(e.clientX, e.clientY, props.user);
        }}
      >
        <span class="size-6 shrink-0 grid place-items-center rounded-full overflow-hidden bg-raised text-micro">
          <ChatterPicture
            userId={props.user.id}
            name={props.user.displayName}
          />
        </span>
        <span class="min-w-0 flex flex-col">
          <span class="truncate text-body text-ink">
            {props.user.displayName}
          </span>
          <Show when={props.detail}>
            <span class="truncate text-small text-ink-faint">
              {props.detail}
            </span>
          </Show>
        </span>
      </button>
      {props.action}
    </div>
  );
}
