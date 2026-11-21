import {
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  onMount,
  untrack,
} from "solid-js";
import { channelEntries } from "../../lib/stores/feeds.ts";
import * as backlog from "../../lib/services/backlog.ts";
import type { FeedMessage, UserRef } from "../../lib/types/index.ts";
import { Portal } from "solid-js/web";
import { captureFocusForRestore } from "../../lib/reactive/focus.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import UserCardHeader from "./UserCardHeader.tsx";
import UserCardModActions from "./UserCardModActions.tsx";
import UserCardFeed from "./UserCardFeed.tsx";
import { mergeMessages } from "./mergeMessages.ts";
import type { UserAction } from "../ui/userLink.ts";
import { dismissOnOutside } from "../../lib/reactive/dismissOnOutside.ts";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  x: number;
  y: number;
  chatterId: string;
  broadcasterId: string;
  broadcasterLogin: string;
  pinned: boolean;
  getBounds: () => DOMRect | null;
  getBoundsElement?: () => HTMLElement | null;
  onClose: () => void;
  onTogglePin: () => void;
  onJumpToMessage: (messageId: string) => void;
  onOpenChannel: (broadcasterId: string) => void;
  onUserContextMenu: UserAction;
  onSwitchUser?: (identity: Partial<UserRef>) => void;
};

const PAD = 8;

export default function UserCard(props: Props) {
  captureFocusForRestore();
  let cardRef: HTMLDivElement | undefined;

  function bounds() {
    const b = props.getBounds();
    return {
      left: b?.left ?? 0,
      top: b?.top ?? 0,
      right: b?.right ?? window.innerWidth,
      bottom: b?.bottom ?? window.innerHeight,
    };
  }

  function clamp(x: number, y: number) {
    const b = bounds();
    const w = cardRef?.offsetWidth ?? 0;
    const h = cardRef?.offsetHeight ?? 0;
    return {
      x: Math.max(b.left + PAD, Math.min(x, b.right - w - PAD)),
      y: Math.max(b.top + PAD, Math.min(y, b.bottom - h - PAD)),
    };
  }

  function roomIn() {
    const b = bounds();
    return {
      w: b.right - b.left - PAD * 2,
      h: b.bottom - b.top - PAD * 2,
    };
  }

  const [pos, setPos] = createSignal({ x: props.x, y: props.y });
  const [room, setRoom] = createSignal(roomIn());
  const [entered, setEntered] = createSignal(false);

  onMount(() => {
    if (!cardRef) return;
    setPos(clamp(props.x, props.y));

    const observer = new ResizeObserver(() => {
      setRoom(roomIn());
      setPos((p) => clamp(p.x, p.y));
    });
    observer.observe(cardRef);
    const target = props.getBoundsElement?.();
    if (target) observer.observe(target);
    onCleanup(() => observer.disconnect());
  });

  dismissOnOutside({
    ref: () => cardRef,
    onDismiss: props.onClose,
    shouldDismiss: () => !props.pinned,
  });
  const bindEscape = () =>
    shortcuts.registerLocal("escape", () => props.onClose());
  let unbindEscape = bindEscape();
  onCleanup(() => unbindEscape());

  function bringToFront() {
    const host = cardRef?.parentElement;
    if (host && host !== document.body.lastElementChild) {
      document.body.appendChild(host);
    }
    unbindEscape();
    unbindEscape = bindEscape();
  }

  function startDrag(e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    const start = pos();
    const offsetX = e.clientX - start.x;
    const offsetY = e.clientY - start.y;
    const onMove = (ev: MouseEvent) => {
      setPos(clamp(ev.clientX - offsetX, ev.clientY - offsetY));
    };
    const onUp = () => {
      endDrag = undefined;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    endDrag = onUp;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }
  let endDrag: (() => void) | undefined;
  onCleanup(() => endDrag?.());

  const live = createMemo<FeedMessage[]>(() =>
    channelEntries(props.broadcasterId).filter(
      (m): m is FeedMessage =>
        m.kind === "message" && m.chatter_user_id === props.chatterId,
    ),
  );
  const [history, { mutate: setHistory }] = createResource(
    () => untrack(live).length === 0 && props.chatterId,
    (chatterId) => backlog.forChatter(props.broadcasterLogin, chatterId),
  );
  const messages = createMemo(() =>
    mergeMessages(history.latest ?? [], live(), props.chatterId),
  );

  return (
    <Portal>
      <div
        ref={cardRef}
        on:mousedown={bringToFront}
        role="dialog"
        aria-label={t("USER_CARD_LABEL")}
        onTransitionEnd={() => setEntered(true)}
        class={`fixed left-(--x) top-(--y) max-w-(--max-w) max-h-(--max-h) z-50 bg-overlay elevation-3 rounded-md overflow-hidden flex flex-col w-card-width h-card-height min-w-min min-h-min resize origin-top-left transition duration-quick ease-out ${
          entered() ? "" : "starting:opacity-0 starting:scale-97"
        }`}
        style={{
          "--x": `${pos().x}px`,
          "--y": `${pos().y}px`,
          "--max-w": `min(var(--spacing-card-max-width), ${room().w}px)`,
          "--max-h": `min(var(--spacing-card-max-height), ${room().h}px)`,
        }}
      >
        <UserCardHeader
          chatterId={props.chatterId}
          broadcasterId={props.broadcasterId}
          messages={messages()}
          pinned={props.pinned}
          onTogglePin={props.onTogglePin}
          onStartDrag={startDrag}
          onContextMenu={(x, y) =>
            props.onUserContextMenu(x, y, { id: props.chatterId })
          }
          onOpenChannel={props.onOpenChannel}
        />
        <UserCardModActions
          chatterId={props.chatterId}
          broadcasterId={props.broadcasterId}
          onRemoved={() =>
            setHistory((h) => h?.map((m) => ({ ...m, deleted: true })))
          }
        />
        <UserCardFeed
          broadcasterId={props.broadcasterId}
          messages={messages()}
          loading={history.loading}
          onJumpToMessage={(messageId) => {
            props.onJumpToMessage(messageId);
            if (!props.pinned) props.onClose();
          }}
          onShowUserCard={(_x, _y, identity) => props.onSwitchUser?.(identity)}
          onUserContextMenu={props.onUserContextMenu}
          onOpenChannel={props.onOpenChannel}
        />
      </div>
    </Portal>
  );
}
