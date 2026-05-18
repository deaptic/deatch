import { Show, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { user } from "../../state/users";
import { sessionManager } from "../../managers/SessionManager";
import { captureFocusForRestore } from "../../utils/focus";
import LogoutIcon from "../../icons/LogoutIcon";

type Props = {
  onClose: () => void;
};

export default function Account(props: Props) {
  captureFocusForRestore();
  let panelRef: HTMLDivElement | undefined;

  const onDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (panelRef?.contains(target)) return;
    if (target.closest("[data-account-toggle]")) return;
    props.onClose();
  };

  const onDocumentKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    e.preventDefault();
    props.onClose();
  };

  onMount(() => {
    document.addEventListener("mousedown", onDocumentClick, { capture: true });
    document.addEventListener("keydown", onDocumentKeyDown);
    onCleanup(() => {
      document.removeEventListener("mousedown", onDocumentClick, { capture: true });
      document.removeEventListener("keydown", onDocumentKeyDown);
    });
  });

  return (
    <Portal>
      <div
        ref={panelRef}
        class="fixed top-12 right-2 z-40 w-72 max-w-[calc(100vw-1rem)] max-h-[calc(100vh-4rem)] bg-bg-dark border border-border-muted rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >
        <div class="flex items-center px-4 h-11 border-b border-border-muted shrink-0">
          <span class="text-text text-sm font-semibold flex-1">Accounts</span>
        </div>
        <div class="flex flex-col p-2 gap-1">
          <Show when={user()}>
            {(u) => (
              <div class="group flex items-center gap-3 px-2 py-2 rounded-md bg-bg transition-colors">
                <img
                  src={
                    u().profile_image_url ||
                    "https://static-cdn.jtvnw.net/user-default-pictures-uec5k4/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png"
                  }
                  alt={u().display_name}
                  class="w-10 h-10 rounded-lg shrink-0"
                />
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-text text-sm font-semibold truncate">
                    {u().display_name}
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
                  <LogoutIcon class="w-4 h-4" />
                </button>
              </div>
            )}
          </Show>
        </div>
      </div>
    </Portal>
  );
}
