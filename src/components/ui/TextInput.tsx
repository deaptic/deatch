import { type JSX, splitProps } from "solid-js";

type Props = JSX.InputHTMLAttributes<HTMLInputElement>;

export default function TextInput(props: Props) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <input
      type="text"
      {...others}
      class={`bg-bg-light text-text text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-primary ${
        local.class ?? ""
      }`}
    />
  );
}
