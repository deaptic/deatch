import { onMount, createEffect, on, splitProps, type JSX } from "solid-js";

export type TextAreaApi = {
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
  maxHeight?: number;
  addons?: JSX.Element;
  children?: JSX.Element;
  ref?: (api: TextAreaApi) => void;
};

export default function TextArea(props: Props) {
  const [local, textareaProps] = splitProps(props, [
    "value",
    "onInput",
    "maxHeight",
    "addons",
    "children",
    "ref",
  ]);

  let textareaRef: HTMLTextAreaElement | undefined;
  let rowRef: HTMLDivElement | undefined;
  let baseH = 0;

  function autoResize() {
    const el = textareaRef;
    if (!el) return;
    el.style.height = "";
    const sh = el.scrollHeight;
    if (!baseH) baseH = sh;
    if (sh > baseH) el.style.height = Math.min(sh, local.maxHeight ?? 200) + "px";
  }

  function insert(text: string) {
    const cur = local.value;
    const next = (cur === "" || cur.endsWith(" ") ? cur : cur + " ") + text + " ";
    local.onInput(next);
    textareaRef?.focus();
  }

  createEffect(on(() => local.value, autoResize));

  onMount(() => {
    local.ref?.({
      focus: () => textareaRef?.focus(),
      insert,
      anchorEl: () => rowRef,
      textareaEl: () => textareaRef,
    });
  });

  return (
    <div ref={rowRef} class="relative flex items-end min-h-14">
      {local.children}
      <textarea
        {...textareaProps}
        ref={textareaRef}
        rows={1}
        value={local.value}
        onInput={(e) => local.onInput(e.currentTarget.value)}
        class="flex-1 self-stretch content-center bg-transparent text-text text-base placeholder-text-muted/60 pl-4 pr-0 py-3 outline-none resize-none overflow-y-auto leading-snug"
      />
      {local.addons}
    </div>
  );
}
