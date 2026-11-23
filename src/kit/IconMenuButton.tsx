import { createSignal, type JSX } from "solid-js";
import IconButton from "./IconButton.tsx";
import Menu from "./Menu.tsx";
import { OVERLAY_GAP } from "./Popover.tsx";
import Transition from "./Transition.tsx";

type Props = {
  label: string;
  tip?: string | false;
  icon: JSX.Element;
  marker?: JSX.Element;
  children: JSX.Element;
};

export default function IconMenuButton(props: Props) {
  const [anchor, setAnchor] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  let button: HTMLButtonElement | undefined;

  const close = () => setAnchor(null);

  function toggle() {
    if (anchor() || !button) return close();
    const r = button.getBoundingClientRect();
    setAnchor({ x: r.right, y: r.bottom + OVERLAY_GAP });
  }

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
          onClick={toggle}
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
            align="end"
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
