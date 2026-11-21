import { ChevronDown } from "lucide-solid";
import { createSignal, type JSX, Show } from "solid-js";
import Button from "./Button.tsx";
import Menu from "./Menu.tsx";
import Popover, { OVERLAY_GAP } from "./Popover.tsx";

/// A list of actions, or a panel holding a small form.
type Look = "menu" | "panel";

type Props = {
  label: string;
  icon: JSX.Element;
  look: Look;
  /// Short state shown beside the icon while it applies, like "5m".
  value?: string;
  /// Replaces the label as the tooltip, to say why it can't be used.
  tip?: string;
  pressed?: boolean;
  disabled?: boolean;
  children: (close: () => void) => JSX.Element;
};

/// An icon with a chevron that opens what it holds below itself; the label
/// names it in the tooltip.
export default function PopoverButton(props: Props) {
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
        variant="ghost"
        size="sm"
        icon={props.icon}
        aria-label={props.label}
        data-tip={props.tip ?? props.label}
        pressed={props.pressed || anchor() !== null}
        disabled={props.disabled}
        aria-haspopup={props.look === "menu" ? "menu" : "dialog"}
        aria-expanded={anchor() !== null}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        <Show when={props.value}>
          <span class="tabular-nums">{props.value}</span>
        </Show>
        <ChevronDown class="size-3.5 -ml-1 -mr-1 text-ink-faint" />
      </Button>
      <Show when={anchor()}>
        {(a) =>
          props.look === "menu" ? (
            <Menu x={a().x} y={a().y} opener={() => button} onClose={close}>
              {props.children(close)}
            </Menu>
          ) : (
            <Popover x={a().x} y={a().y} opener={() => button} onClose={close}>
              {props.children(close)}
            </Popover>
          )
        }
      </Show>
    </>
  );
}
