import type { JSX } from "solid-js";
import IconButton from "./IconButton.tsx";
import Menu from "./Menu.tsx";
import { createAnchoredToggle } from "./createPopover.ts";
import Transition from "./Transition.tsx";

type Props = {
  align?: "center" | "end";
  label: string;
  tip?: string | false;
  icon: JSX.Element;
  marker?: JSX.Element;
  children: JSX.Element;
};

export default function IconMenuButton(props: Props) {
  const { anchor, toggle, close } = createAnchoredToggle(
    props.align ?? "center",
  );
  let button: HTMLButtonElement | undefined;

  return (
    <>
      <span class="relative flex">
        <IconButton
          ref={button}
          label={props.label}
          tip={props.tip}
          size="sm"
          pressed={anchor() !== null}
          aria-haspopup="menu"
          aria-expanded={anchor() !== null}
          onClick={() => toggle(button)}
        >
          {props.icon}
        </IconButton>
        {props.marker}
      </span>
      <Transition when={anchor()}>
        {(a) => (
          <Menu
            x={a().x}
            y={a().y}
            align={props.align ?? "center"}
            opener={() => button}
            onClose={close}
          >
            {props.children}
          </Menu>
        )}
      </Transition>
    </>
  );
}
