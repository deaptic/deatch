import { children, type JSX } from "solid-js";

type Props = {
  ref?: (el: HTMLDivElement) => void;
  leading?: JSX.Element;
  children: JSX.Element;
};

export default function InputGroup(props: Props) {
  const leading = children(() => props.leading);
  return (
    <div
      ref={props.ref}
      class={`relative flex items-end gap-1 min-h-row ${leading() ? "pl-2.5" : "pl-3.5"} pr-2.5 py-1 bg-canvas border border-line rounded-lg transition duration-snap hover:border-ink-faint focus-within:border-accent! focus-within:ring-3 focus-within:ring-accent-soft`}
    >
      {leading()}
      {props.children}
    </div>
  );
}
