import { LogOut } from "lucide-solid";
import { Show } from "solid-js";
import { user } from "../../lib/stores/users.ts";
import { sessionManager } from "../../lib/managers/SessionManager.ts";
import Avatar from "../ui/Avatar.tsx";
import Panel from "../ui/Panel.tsx";

type Props = {
  onClose: () => void;
};

export default function Account(props: Props) {
  return (
    <Panel
      title="Accounts"
      onClose={props.onClose}
      ignoreSelector="[data-account-toggle]"
      sizeClass="w-72 max-w-[calc(100vw-1rem)] max-h-[calc(100vh-4rem)]"
    >
      <div class="flex flex-col p-2 gap-1">
        <Show when={user()}>
          {(u) => (
            <div class="group flex items-center gap-3 px-2 py-2 rounded-md bg-bg transition-colors">
              <Avatar
                src={u().profileImageUrl}
                alt={u().displayName}
                class="w-10 h-10 rounded-lg shrink-0"
              />
              <div class="flex flex-col min-w-0 flex-1">
                <span class="text-text text-sm font-semibold truncate">
                  {u().displayName}
                </span>
                <span class="text-text-muted text-xs truncate">
                  @{u().login}
                </span>
              </div>
              <button
                class="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-bg-dark cursor-pointer transition-colors"
                onClick={() => {
                  props.onClose();
                  sessionManager.logout();
                }}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut class="w-4 h-4" />
              </button>
            </div>
          )}
        </Show>
      </div>
    </Panel>
  );
}
