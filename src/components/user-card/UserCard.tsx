import { createSignal, onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { captureFocusForRestore } from "../../utils/focus";
import UserCardHeader from "./UserCardHeader";
import UserCardModActions from "./UserCardModActions";
import UserCardFeed from "./UserCardFeed";

type Props = {
  x: number;
  y: number;
  chatterId: string;
  broadcasterId: string;
  getBounds: () => DOMRect | null;
  onClose: () => void;
};

const CARD_W = 384;
const CARD_MAX_H = 480;
const PAD = 8;

export default function UserCard(props: Props) {
  captureFocusForRestore();
  let cardRef: HTMLDivElement | undefined;

  function clamp(x: number, y: number, w: number, h: number) {
    const b = props.getBounds();
    const left = b?.left ?? 0;
    const top = b?.top ?? 0;
    const right = b?.right ?? window.innerWidth;
    const bottom = b?.bottom ?? window.innerHeight;
    return {
      x: Math.max(left + PAD, Math.min(x, right - w - PAD)),
      y: Math.max(top + PAD, Math.min(y, bottom - h - PAD)),
    };
  }

  const [pos, setPos] = createSignal(clamp(props.x, props.y, CARD_W, CARD_MAX_H));
  const [pinned, setPinned] = createSignal(false);

  onMount(() => {
    if (!cardRef) return;
    const rect = cardRef.getBoundingClientRect();
    setPos(clamp(props.x, props.y, rect.width, rect.height));
  });

  const onDocumentMouseDown = (e: MouseEvent) => {
    if (pinned()) return;
    if (cardRef?.contains(e.target as Node)) return;
    props.onClose();
  };
  const onDocumentKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    e.preventDefault();
    props.onClose();
  };
  document.addEventListener("mousedown", onDocumentMouseDown, { capture: true });
  document.addEventListener("keydown", onDocumentKeyDown);
  onCleanup(() => {
    document.removeEventListener("mousedown", onDocumentMouseDown, { capture: true });
    document.removeEventListener("keydown", onDocumentKeyDown);
  });

  function startDrag(e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    const start = pos();
    const offsetX = e.clientX - start.x;
    const offsetY = e.clientY - start.y;
    const onMove = (ev: MouseEvent) => {
      const w = cardRef?.offsetWidth ?? CARD_W;
      const h = cardRef?.offsetHeight ?? CARD_MAX_H;
      setPos(clamp(ev.clientX - offsetX, ev.clientY - offsetY, w, h));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <Portal>
      <div
        ref={cardRef}
        class="fixed z-50 bg-bg-dark border border-border-muted rounded-lg shadow-2xl overflow-hidden flex flex-col w-96 h-96 min-w-72 min-h-64 resize"
        style={{
          top: `${pos().y}px`,
          left: `${pos().x}px`,
          "max-width": `calc(100vw - ${pos().x}px - ${PAD}px)`,
          "max-height": `calc(100vh - ${pos().y}px - ${PAD}px)`,
        }}
      >
        <UserCardHeader
          chatterId={props.chatterId}
          broadcasterId={props.broadcasterId}
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
        />
      </div>
    </Portal>
  );
}
