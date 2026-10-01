import { ChevronDown } from "lucide-solid";
import { createSignal, type JSX, Show } from "solid-js";
import Button, { type ButtonVariant } from "./Button.tsx";
import Menu from "./Menu.tsx";

const GAP = 4;

type Props = {
  label: string;
  icon?: JSX.Element;
  title?: string;
  variant?: Extract<ButtonVariant, "neutral" | "ghost">;
  pressed?: boolean;
  children: (close: () => void) => JSX.Element;
};

export default function MenuButton(props: Props) {
  const [anchor, setAnchor] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  let button: HTMLButtonElement | undefined;

  const close = () => setAnchor(null);

  function toggle() {
    if (anchor() || !button) return close();
    const r = button.getBoundingClientRect();
    setAnchor({ x: r.left, y: r.bottom + GAP });
  }

  return (
    <>
      <Button
        ref={button}
        variant={props.variant ?? "neutral"}
        size="sm"
        icon={props.icon}
        title={props.title}
        pressed={props.pressed}
        aria-haspopup="menu"
        aria-expanded={anchor() !== null}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        {props.label}
        <ChevronDown class="size-3.5 -mr-1" />
      </Button>
      <Show when={anchor()}>
        {(a) => (
          <Menu x={a().x} y={a().y} opener={() => button} onClose={close}>
            {props.children(close)}
          </Menu>
        )}
      </Show>
    </>
  );
}
