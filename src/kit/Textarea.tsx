import { type JSX, splitProps } from "solid-js";

type Props = JSX.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  resizable?: boolean;
};

export default function Textarea(props: Props) {
  const [local, others] = splitProps(props, ["class", "resizable"]);
  return (
    <textarea
      rows={3}
      {...others}
      class={`w-full px-3 py-2 rounded-sm bg-surface border border-line text-base text-ink placeholder:text-ink-faint outline-none ${
        local.resizable ? "resize-y" : "resize-none"
      } transition duration-snap hover:border-ink-faint focus:border-accent focus:ring-3 focus:ring-accent-soft disabled:opacity-40 ${
        local.class ?? ""
      }`}
    />
  );
}
