import { type JSX } from "solid-js";

type Variant = "default" | "success" | "danger";

type Props = {
  title: string;
  onClick: (e: MouseEvent & { currentTarget: HTMLButtonElement }) => void;
  children: JSX.Element;
  variant?: Variant;
  disabled?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  default: "text-text-muted hover:text-text hover:bg-bg-light",
  success: "bg-success text-text hover:bg-success/80",
  danger: "bg-danger text-text hover:bg-danger/80",
};

export default function ToolbarItem(props: Props) {
  return (
    <button
      title={props.title}
      disabled={props.disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick(e);
      }}
      class={`size-8 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        VARIANTS[props.variant ?? "default"]
      }`}
    >
      {props.children}
    </button>
  );
}
