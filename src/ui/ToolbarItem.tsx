import { type JSX } from "solid-js";

type Props = {
  title: string;
  onClick: (e: MouseEvent & { currentTarget: HTMLButtonElement }) => void;
  children: JSX.Element;
};

export default function ToolbarItem(props: Props) {
  return (
    <button
      title={props.title}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick(e);
      }}
      class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-light transition-colors cursor-pointer"
    >
      {props.children}
    </button>
  );
}
