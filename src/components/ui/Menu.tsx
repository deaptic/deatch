import { createContext, type JSX } from "solid-js";
import Popover from "./Popover.tsx";
import { focusables } from "../../lib/reactive/trapFocus.ts";
import { wrapIndex } from "../../lib/reactive/createListNavigation.ts";

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

/// Closes the enclosing menu; items call it once they have acted.
export const MenuClose = createContext<() => void>();

type Props = {
  x: number;
  y: number;
  align?: "start" | "center" | "end";
  opener?: () => HTMLElement | undefined;
  onClose: () => void;
  children: JSX.Element;
};

export default function Menu(props: Props) {
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
          role="menu"
          class="min-w-55 max-w-full p-1.5 flex flex-col"
          onKeyDown={moveFocus}
        >
          {props.children}
        </div>
      </MenuClose.Provider>
    </Popover>
  );
}
