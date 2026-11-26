import { MessageCircle, Plus } from "lucide-solid";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import Divider from "../../../kit/Divider.tsx";
import EmptyState from "../../../kit/EmptyState.tsx";
import IconTile from "../../../kit/IconTile.tsx";
import { SIDE_GAP } from "../../../kit/Popover.tsx";
import SideRow from "../../../kit/SideRow.tsx";
import Surface from "../../../kit/Surface.tsx";
import Text from "../../../kit/Text.tsx";
import Transition from "../../../kit/Transition.tsx";
import { createPopover } from "../../../kit/createPopover.ts";
import ConversationRow from "./ConversationRow.tsx";
import NewWhisperPopover from "./NewWhisperPopover.tsx";
import WhisperThread from "./WhisperThread.tsx";
import { conversationsOf } from "./model.ts";
import * as whispers from "./store.ts";

const LIST_PX = 280;
const THREAD_MIN_PX = 420;
const COLLAPSE_BELOW_PX = LIST_PX + THREAD_MIN_PX;

export default function Whispers() {
  const [expanded, setExpanded] = createSignal(true);
  const [measured, setMeasured] = createSignal(false);
  const picker = createPopover();
  let root: HTMLDivElement | undefined;
  let newButton: HTMLButtonElement | undefined;

  const conversations = () =>
    conversationsOf(whispers.whispers(), whispers.drafts());

  onMount(() => {
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setExpanded(entry.contentRect.width >= COLLAPSE_BELOW_PX);
      if (!measured()) requestAnimationFrame(() => setMeasured(true));
    });
    observer.observe(root);
    onCleanup(() => observer.disconnect());
  });

  function openPicker() {
    if (!newButton || picker.state()) return picker.close();
    const rect = newButton.getBoundingClientRect();
    picker.open(rect.right + SIDE_GAP, rect.top, {});
  }

  return (
    <div ref={root} class="flex-1 min-h-0 min-w-0 flex">
      <aside
        class={`shrink-0 min-h-0 overflow-hidden ${
          measured() ? "transition-all duration-settle ease-drawer" : ""
        } ${expanded() ? "w-rail-expanded" : "w-rail"}`}
      >
        <Surface tone="none" edge="right" class="h-full min-h-0 flex flex-col">
          <div class="py-2 shrink-0">
            <SideRow
              ref={(el) => (newButton = el)}
              expanded={expanded()}
              label={t("WHISPERS_NEW_LABEL")}
              onClick={openPicker}
            >
              <IconTile active={picker.state() ? "accent" : false}>
                <Plus />
              </IconTile>
            </SideRow>
          </div>
          <Divider class="mx-4" />
          <div class="flex-1 min-h-0 overflow-y-auto py-2 flex flex-col gap-row-gap">
            <For
              each={conversations()}
              fallback={
                <Show when={expanded()}>
                  <div class="px-4 py-2">
                    <Text as="p" size="sm" tone="faint">
                      {t("WHISPERS_EMPTY")}
                    </Text>
                  </div>
                </Show>
              }
            >
              {(c) => (
                <ConversationRow
                  conversation={c}
                  expanded={expanded()}
                  selected={whispers.openPeer()?.id === c.peer.id}
                  onSelect={() => whispers.open(c.peer)}
                  onDiscard={() => whispers.discard(c.peer.id)}
                />
              )}
            </For>
          </div>
        </Surface>
      </aside>
      <Show
        when={whispers.openPeer()}
        keyed
        fallback={
          <div class="flex-1 flex">
            <EmptyState
              icon={<MessageCircle />}
              title={t("WHISPERS_PICK_TITLE")}
              body={t("WHISPERS_PICK_DESCRIPTION")}
            />
          </div>
        }
      >
        {(peer) => <WhisperThread peer={peer} />}
      </Show>
      <Transition when={picker.state()}>
        {(p) => (
          <NewWhisperPopover
            x={p().x}
            y={p().y}
            opener={() => newButton}
            onPick={whispers.open}
            onClose={picker.close}
          />
        )}
      </Transition>
    </div>
  );
}
