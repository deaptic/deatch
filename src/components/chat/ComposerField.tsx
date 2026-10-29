import { type JSX, onMount, splitProps } from "solid-js";
import ComposerBox from "../ui/ComposerBox.tsx";

export type ComposerFieldApi = {
  focus: () => void;
  insert: (text: string) => void;
  anchorEl: () => HTMLDivElement | undefined;
  textareaEl: () => HTMLTextAreaElement | undefined;
};

type Props = Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onInput" | "ref" | "rows" | "class" | "children"
> & {
  value: string;
  onInput: (value: string) => void;
  addons?: JSX.Element;
  children?: JSX.Element;
  ref?: (api: ComposerFieldApi) => void;
};

export default function ComposerField(props: Props) {
  const [local, textareaProps] = splitProps(props, [
    "value",
    "onInput",
    "addons",
    "children",
    "ref",
  ]);

  let textareaRef: HTMLTextAreaElement | undefined;
  let rowRef: HTMLDivElement | undefined;

  function insert(text: string) {
    const cur = local.value;
    const next =
      (cur === "" || cur.endsWith(" ") ? cur : cur + " ") + text + " ";
    local.onInput(next);
    textareaRef?.focus();
  }

  onMount(() => {
    local.ref?.({
      focus: () => textareaRef?.focus(),
      insert,
      anchorEl: () => rowRef,
      textareaEl: () => textareaRef,
    });
  });

  return (
    <ComposerBox ref={(el) => (rowRef = el)}>
      {local.children}
      <textarea
        {...textareaProps}
        ref={textareaRef}
        rows={1}
        value={local.value}
        onInput={(e) => local.onInput(e.currentTarget.value)}
        class="flex-1 self-stretch content-center bg-transparent text-body text-ink placeholder:text-ink-faint py-2 pr-1 outline-none resize-none overflow-y-auto field-sizing-content max-h-27.5"
      />
      {local.addons}
    </ComposerBox>
  );
}
