import { type JSX, onCleanup, onMount } from "solid-js";
import Popover from "./Popover.tsx";
import { MenuClose } from "./menuClose.ts";
import MenuHost from "./MenuHost.tsx";
import { focusables } from "../shared/solid/trapFocus.ts";
import { wrapIndex } from "../shared/solid/createListNavigation.ts";

const STEPS: Record<string, (index: number, count: number) => number> = {
  ArrowDown: (i, count) => wrapIndex(i, 1, count),
  ArrowUp: (i, count) => wrapIndex(i, -1, count),
  Home: () => 0,
  End: (_, count) => count - 1,
};

function moveFocus(e: KeyboardEvent & { currentTarget: HTMLElement }) {
  const step = STEPS[e.key];
  if (!step) return;
  e.preventDefault();
  const items = focusables(e.currentTarget);
  const current = items.indexOf(document.activeElement as HTMLElement);
  const from = current >= 0 ? current : e.key === "ArrowUp" ? 0 : -1;
  items[step(from, items.length)]?.focus();
}

const LEAVE_CLOSE_MS = 400;
const LEAVE_MARGIN_PX = 24;

function isNear(el: HTMLElement, e: PointerEvent): boolean {
  const r = el.getBoundingClientRect();
  return (
    e.clientX >= r.left - LEAVE_MARGIN_PX &&
    e.clientX <= r.right + LEAVE_MARGIN_PX &&
    e.clientY >= r.top - LEAVE_MARGIN_PX &&
    e.clientY <= r.bottom + LEAVE_MARGIN_PX
  );
}

export { MenuClose } from "./menuClose.ts";

type Props = {
  x: number;
  y: number;
  align?: "start" | "center" | "end";
  opener?: () => HTMLElement | undefined;
  onClose: () => void;
  children: JSX.Element;
};

export default function Menu(props: Props) {
  let menu: HTMLDivElement | undefined;
  let leaving: ReturnType<typeof setTimeout> | undefined;

  function track(e: PointerEvent) {
    if (!menu) return;
    if (isNear(menu, e)) {
      clearTimeout(leaving);
      leaving = undefined;
    } else {
      leaving ??= setTimeout(() => props.onClose(), LEAVE_CLOSE_MS);
    }
  }

  onMount(() => window.addEventListener("pointermove", track));
  onCleanup(() => {
    window.removeEventListener("pointermove", track);
    clearTimeout(leaving);
  });

  return (
    <Popover
      x={props.x}
      y={props.y}
      align={props.align}
      opener={props.opener}
      onClose={props.onClose}
      events={["mousedown", "contextmenu"]}
    >
      <MenuClose.Provider value={() => props.onClose()}>
        <div
          ref={menu}
          role="menu"
          class="min-w-55 max-w-full p-1.5 flex flex-col"
          onKeyDown={moveFocus}
        >
          <MenuHost>{props.children}</MenuHost>
        </div>
      </MenuClose.Provider>
    </Popover>
  );
}
