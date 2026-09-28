import { LogOut } from "lucide-solid";
import { Show } from "solid-js";
import { user } from "../../lib/stores/users.ts";
import { sessionManager } from "../../lib/managers/SessionManager.ts";
import Avatar from "../ui/Avatar.tsx";
import Button from "../ui/Button.tsx";
import Popover from "../ui/Popover.tsx";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
};

export default function Account(props: Props) {
  return (
    <Popover x={props.x} y={props.y} onClose={props.onClose}>
      <Show when={user()}>
        {(u) => (
          <div class="w-72 p-3 flex flex-col gap-3">
            <div class="flex items-center gap-3 px-1">
              <Avatar
                src={u().profileImageUrl}
                alt={u().displayName}
                size={40}
              />
              <div class="flex flex-col min-w-0 flex-1">
                <span class="text-body font-semibold text-ink truncate">
                  {u().displayName}
                </span>
                <span class="text-small text-ink-soft truncate">
                  @{u().login}
                </span>
              </div>
            </div>
            <Button
              variant="neutral"
              icon={<LogOut class="size-4" />}
              onClick={() => {
                props.onClose();
                sessionManager.logout();
              }}
            >
              Log out
            </Button>
          </div>
        )}
      </Show>
    </Popover>
  );
}
