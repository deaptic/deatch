import { type JSX, splitProps } from "solid-js";

type Props = JSX.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea(props: Props) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <textarea
      rows={3}
      {...others}
      class={`w-full px-3 py-2 rounded-sm bg-surface border border-line text-body text-ink placeholder:text-ink-faint outline-none resize-none transition-colors duration-snap hover:border-ink-faint focus:border-accent disabled:opacity-40 ${
        local.class ?? ""
      }`}
    />
  );
}
