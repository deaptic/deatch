import { type JSX, Show } from "solid-js";

type Props = {
  selected?: boolean;
  actions?: JSX.Element;
  revealActions?: boolean;
  onClick?: (e: MouseEvent) => void;
  onContextMenu?: (e: MouseEvent) => void;
  children: JSX.Element;
};

const MAIN = "flex-1 min-w-0 min-h-9 flex items-center gap-2.5 px-2.5 py-1.5";

export default function ListRow(props: Props) {
  return (
    <div
      class={`group flex items-center gap-1 pr-1 rounded-sm hover:bg-raised ${
        props.selected ? "bg-raised" : ""
      }`}
    >
      <Show
        when={props.onClick}
        fallback={<div class={MAIN}>{props.children}</div>}
      >
        {(onClick) => (
          <button
            type="button"
            aria-current={props.selected}
            class={`${MAIN} text-left cursor-pointer`}
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
      <Show when={props.actions}>
        <span
          class={`flex shrink-0 items-center ${
            props.revealActions
              ? "invisible group-hover:visible group-focus-within:visible"
              : ""
          }`}
        >
          {props.actions}
        </span>
      </Show>
    </div>
  );
}
