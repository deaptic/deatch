import { createEffect, type JSX, on, onMount, splitProps } from "solid-js";

export type ComposerFieldApi = {
  focus: () => void;
  insert: (text: string) => void;
  anchorEl: () => HTMLDivElement | undefined;
  textareaEl: () => HTMLTextAreaElement | undefined;
};

type Props =
  & Omit<
    JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "onInput" | "ref" | "rows" | "class" | "children"
  >
  & {
    value: string;
    onInput: (value: string) => void;
    maxHeight?: number;
    addons?: JSX.Element;
    children?: JSX.Element;
    ref?: (api: ComposerFieldApi) => void;
  };

export default function ComposerField(props: Props) {
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
    if (sh > baseH) {
      el.style.height = Math.min(sh, local.maxHeight ?? 110) + "px";
    }
  }

  function insert(text: string) {
    const cur = local.value;
    const next = (cur === "" || cur.endsWith(" ") ? cur : cur + " ") + text +
      " ";
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
    <div
      ref={rowRef}
      class="relative flex items-end gap-1 min-h-control-lg pl-3.5 pr-1.5 py-1 bg-surface border border-line rounded-md transition-colors duration-snap hover:border-ink-faint focus-within:border-accent! "
    >
      {local.children}
      <textarea
        {...textareaProps}
        ref={textareaRef}
        rows={1}
        value={local.value}
        onInput={(e) => local.onInput(e.currentTarget.value)}
        class="flex-1 self-stretch content-center bg-transparent text-body text-ink placeholder:text-ink-faint py-2 pr-1 outline-none resize-none overflow-y-auto"
      />
      {local.addons}
    </div>
  );
}
