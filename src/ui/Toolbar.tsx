import { type JSX } from "solid-js";

type Props = {
  children: JSX.Element;
  /// When true, the toolbar is always visible instead of fading in on hover
  /// of the parent `.group` container.
  alwaysVisible?: boolean;
};

export default function Toolbar(props: Props) {
  const visibility = () =>
    props.alwaysVisible
      ? ""
      : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-100";
  return (
    <div
      class={`absolute right-2 top-0 -translate-y-1/2 z-10 flex items-center gap-0.5 bg-bg border border-border-muted rounded-lg shadow-xl overflow-hidden ${visibility()}`}
    >
      {props.children}
    </div>
  );
}
