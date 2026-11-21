import { ChevronDown } from "lucide-solid";
import { createSignal, type JSX, Show } from "solid-js";
import Button, { type ButtonVariant } from "./Button.tsx";
import Menu from "./Menu.tsx";
import { OVERLAY_GAP } from "./Popover.tsx";

/// An icon with a chevron that opens a menu; the label is its tooltip.
type Props = {
  label: string;
  icon: JSX.Element;
  variant?: Extract<ButtonVariant, "neutral" | "ghost">;
  pressed?: boolean;
  children: JSX.Element;
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
    setAnchor({ x: r.left, y: r.bottom + OVERLAY_GAP });
  }

  return (
    <>
      <Button
        ref={button}
        variant={props.variant ?? "neutral"}
        size="sm"
        icon={props.icon}
        aria-label={props.label}
        data-tip={props.label}
        pressed={props.pressed}
        aria-haspopup="menu"
        aria-expanded={anchor() !== null}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        <ChevronDown class="size-3.5 -ml-1 -mr-1 text-ink-faint" />
      </Button>
      <Show when={anchor()}>
        {(a) => (
          <Menu x={a().x} y={a().y} opener={() => button} onClose={close}>
            {props.children}
          </Menu>
        )}
      </Show>
    </>
  );
}
