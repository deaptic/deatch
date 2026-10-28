import { createContext, type JSX } from "solid-js";
import Popover from "./Popover.tsx";

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
        <div class="min-w-55 max-w-full p-1.5 flex flex-col">
          {props.children}
        </div>
      </MenuClose.Provider>
    </Popover>
  );
}
