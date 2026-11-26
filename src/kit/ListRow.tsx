import { children, type JSX, Show } from "solid-js";

type Props = {
  selected?: boolean;
  disabled?: boolean;
  actions?: JSX.Element;
  revealActions?: boolean;
  onClick?: (e: MouseEvent) => void;
  onContextMenu?: (e: MouseEvent) => void;
  children: JSX.Element;
};

const MAIN =
  "flex-1 min-w-0 min-h-control-md flex items-center gap-2.5 px-2.5 py-1.5";

export default function ListRow(props: Props) {
  const actions = children(() => props.actions);
  return (
    <div
      class={`group flex items-center gap-1 pr-1 rounded-sm ${
        props.disabled ? "opacity-40" : "hover:bg-raised"
      } ${props.selected ? "bg-raised" : ""}`}
    >
      <Show
        when={props.onClick}
        fallback={<div class={MAIN}>{props.children}</div>}
      >
        {(onClick) => (
          <button
            type="button"
            aria-current={props.selected}
            disabled={props.disabled}
            class={`${MAIN} text-left cursor-pointer disabled:cursor-not-allowed`}
            onClick={(e) => onClick()(e)}
            onContextMenu={(e) => {
              if (!props.onContextMenu) return;
              e.preventDefault();
              props.onContextMenu(e);
            }}
          >
            {props.children}
          </button>
        )}
      </Show>
      <Show when={actions.toArray().length}>
        <span
          class={`flex shrink-0 items-center ${
            props.revealActions
              ? "invisible group-hover:visible group-focus-within:visible"
              : ""
          }`}
        >
          {actions()}
        </span>
      </Show>
    </div>
  );
}
