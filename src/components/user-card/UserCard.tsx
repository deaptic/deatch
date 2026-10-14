import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { feeds } from "../../lib/stores/feeds.ts";
import type { FeedMessage } from "../../lib/types/index.ts";
import { Portal } from "solid-js/web";
import { captureFocusForRestore } from "../../lib/utils/focus.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import UserCardHeader from "./UserCardHeader.tsx";
import UserCardModActions from "./UserCardModActions.tsx";
import UserCardFeed from "./UserCardFeed.tsx";
import { dismissOnOutside } from "../../lib/primitives/dismissOnOutside.ts";
import type { UserRef } from "../../lib/types/index.ts";

type Props = {
  x: number;
  y: number;
  chatterId: string;
  broadcasterId: string;
  getBounds: () => DOMRect | null;
  getBoundsElement?: () => HTMLElement | null;
  onClose: () => void;
  onJumpToMessage?: (channelId: string, messageId: string) => void;
  onSwitchUser?: (identity: Partial<UserRef>) => void;
};

const PAD = 8;

const CARD_VARS = {
  "--card-w": "22.5rem",
  "--card-h": "35rem",
  "--feed-min-h": "calc(3lh + 0.5rem)",
  "--card-max-w": "40rem",
  "--card-max-h": "50rem",
  "--card-pad": "1.25rem",
  "--card-gap": "0.625rem",
  "--card-name": "1.45rem",
  "--card-meta": "0.95rem",
  "--avatar-lift": "2.5rem",
  "--meta-icon": "1em",
};

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
  const [pinned, setPinned] = createSignal(false);

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
    shouldDismiss: () => !pinned(),
  });
  shortcuts.setContext("userCardOpen", true);
  const unbindEsc = shortcuts.registerLocal(
    "escape",
    () => {
      props.onClose();
    },
    "userCardOpen",
  );
  onCleanup(() => {
    unbindEsc();
    shortcuts.setContext("userCardOpen", false);
  });

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
  // Escape can close the card mid-drag; the listeners must go with it.
  let endDrag: (() => void) | undefined;
  onCleanup(() => endDrag?.());

  const messages = createMemo<FeedMessage[]>(() =>
    (feeds[props.broadcasterId]?.messages ?? []).filter(
      (m): m is FeedMessage =>
        m.kind === "message" && m.chatter_user_id === props.chatterId,
    )
  );

  return (
    <Portal>
      <div
        ref={cardRef}
        role="dialog"
        aria-label="User card"
        class="fixed left-(--x) top-(--y) max-w-(--max-w) max-h-(--max-h) z-50 bg-overlay border border-line rounded-md overflow-hidden flex flex-col w-(--card-w) h-(--card-h) min-w-(--card-w) min-h-min resize transition duration-quick ease-out starting:opacity-0 starting:translate-y-1"
        style={{
          ...CARD_VARS,
          "--x": `${pos().x}px`,
          "--y": `${pos().y}px`,
          "--max-w": `min(var(--card-max-w), ${room().w}px)`,
          "--max-h": `min(var(--card-max-h), ${room().h}px)`,
        }}
      >
        <UserCardHeader
          chatterId={props.chatterId}
          broadcasterId={props.broadcasterId}
          messages={messages()}
          pinned={pinned()}
          onTogglePin={() => setPinned((p) => !p)}
          onStartDrag={startDrag}
        />
        <UserCardModActions
          chatterId={props.chatterId}
          broadcasterId={props.broadcasterId}
        />
        <UserCardFeed
          chatterId={props.chatterId}
          broadcasterId={props.broadcasterId}
          hasMessages={messages().length > 0}
          onJumpToMessage={(messageId) => {
            props.onJumpToMessage?.(props.broadcasterId, messageId);
            props.onClose();
          }}
          onShowUserCard={(_x, _y, identity) => props.onSwitchUser?.(identity)}
        />
      </div>
    </Portal>
  );
}
