import { splitProps, type JSX } from "solid-js";

type Props = JSX.InputHTMLAttributes<HTMLInputElement>;

export default function TextInput(props: Props) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <input
      type="text"
      {...others}
      class={`bg-[#2d2d35] text-[#efeff1] text-sm rounded px-2 py-1.5 border border-[#3d3d4a] focus:outline-none focus:border-[#9146ff] ${local.class ?? ""}`}
    />
  );
}
