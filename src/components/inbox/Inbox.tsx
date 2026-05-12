import { For, Show, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import InboxItem from "./InboxItem";
import { mentions, markAllMentionsRead } from "../../state/inbox";

type Props = {
  onClose: () => void;
  onJump: (channelId: string, messageId: string) => void;
};

export default function Inbox(props: Props) {
  let panelRef: HTMLDivElement | undefined;

  const onDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (panelRef?.contains(target)) return;
    if (target.closest("[data-inbox-toggle]")) return;
    props.onClose();
  };

  onMount(() => {
    document.addEventListener("mousedown", onDocumentClick, { capture: true });
    onCleanup(() => document.removeEventListener("mousedown", onDocumentClick, { capture: true }));
  });

  return (
    <Portal>
      <div
        ref={panelRef}
        class="fixed top-12 right-2 z-40 w-96 max-h-[70vh] bg-bg border border-border-muted rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >
        <div class="flex items-center px-4 h-11 border-b border-border-muted shrink-0">
          <span class="text-text text-sm font-semibold flex-1">Mentions</span>
          <button
            onClick={markAllMentionsRead}
            class="text-text-muted hover:text-text text-xs cursor-pointer transition-colors"
          >
            Mark all read
          </button>
        </div>
        <Show
          when={mentions().length > 0}
          fallback={
            <div class="flex-1 flex items-center justify-center px-6 py-10">
              <span class="text-text-muted text-sm">No mentions yet</span>
            </div>
          }
        >
          <div class="flex-1 overflow-y-auto">
            <For each={mentions()}>
              {(m) => (
                <InboxItem
                  mention={m}
                  onClick={() => {
                    props.onJump(m.channelId, m.messageId);
                    props.onClose();
                  }}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </Portal>
  );
}
