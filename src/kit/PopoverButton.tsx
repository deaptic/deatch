import { ChevronDown } from "lucide-solid";
import { type JSX, Show } from "solid-js";
import Button from "./Button.tsx";
import Menu from "./Menu.tsx";
import Popover from "./Popover.tsx";
import { createAnchoredToggle } from "./createPopover.ts";
import Transition from "./Transition.tsx";

type Variant = "menu" | "panel";

type Props = {
  label: string;
  icon: JSX.Element;
  variant: Variant;
  value?: string;
  tip?: string;
  pressed?: boolean;
  disabled?: boolean;
  children: (close: () => void) => JSX.Element;
};

export default function PopoverButton(props: Props) {
  const { anchor, toggle, close } = createAnchoredToggle("start");
  let button: HTMLButtonElement | undefined;

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
        aria-haspopup={props.variant === "menu" ? "menu" : "dialog"}
        aria-expanded={anchor() !== null}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => toggle(button)}
      >
        <Show when={props.value}>
          <span class="tabular-nums">{props.value}</span>
        </Show>
        <ChevronDown class="size-3.5 -ml-1 -mr-1 text-ink-faint" />
      </Button>
      <Transition when={anchor()}>
        {(a) =>
          props.variant === "menu" ? (
            <Menu x={a().x} y={a().y} opener={() => button} onClose={close}>
              {props.children(close)}
            </Menu>
          ) : (
            <Popover x={a().x} y={a().y} opener={() => button} onClose={close}>
              {props.children(close)}
            </Popover>
          )
        }
      </Transition>
    </>
  );
}
