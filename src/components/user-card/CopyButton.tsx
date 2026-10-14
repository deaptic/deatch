import { Check } from "lucide-solid";
import type { JSX } from "solid-js";
import { createCopied } from "../../lib/primitives/createCopied.ts";
import IconButton from "../ui/IconButton.tsx";

type Props = {
  copy: string;
  label: string;
  children: JSX.Element;
};

export default function CopyButton(props: Props) {
  const { copied, copy } = createCopied();

  return (
    <IconButton
      label={props.label}
      size="sm"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => copy(props.copy)}
    >
      {copied() ? <Check class="size-4 text-positive" /> : props.children}
    </IconButton>
  );
}
