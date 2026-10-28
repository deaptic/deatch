import { Show } from "solid-js";
import type { User } from "../../lib/types/index.ts";
import DisplayName from "../ui/DisplayName.tsx";

type Props = {
  chatterId: string;
  user: User | null;
  color: string | undefined;
};

export default function UserCardIdentity(props: Props) {
  return (
    <div class="min-w-0 flex items-center leading-tight">
      <span class="truncate min-w-0 text-(length:--card-name)">
        <Show
          when={props.user}
          fallback={
            <span class="font-semibold text-ink">{props.chatterId}</span>
          }
        >
          {(user) => (
            <DisplayName
              login={user().login}
              displayName={user().displayName}
              color={props.color}
              userId={props.chatterId}
            />
          )}
        </Show>
      </span>
    </div>
  );
}
