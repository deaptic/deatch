import { ChevronLeft } from "lucide-solid";
import {
  createContext,
  createEffect,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
} from "solid-js";
import * as shortcuts from "../shared/keyboard/shortcuts.ts";
import { focusables } from "../shared/solid/trapFocus.ts";
import MenuDivider from "./MenuDivider.tsx";
import MenuItem from "./MenuItem.tsx";

export type MenuPage = {
  title: string;
  content: () => JSX.Element;
  opener?: HTMLElement;
};

export const MenuPages = createContext<(page: MenuPage) => void>();

const BACK_KEYS = new Set(["ArrowLeft", "Backspace"]);

function Page(props: { page: MenuPage; current: boolean; onBack: () => void }) {
  let el: HTMLDivElement | undefined;
  onMount(() => {
    const items = el ? focusables(el) : [];
    (items[1] ?? items[0])?.focus();
  });

  return (
    <div
      ref={el}
      class={props.current ? "flex flex-col" : "hidden"}
      onKeyDown={(e) => {
        if (!BACK_KEYS.has(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        props.onBack();
      }}
    >
      <MenuItem
        label={props.page.title}
        icon={<ChevronLeft />}
        keepOpen
        onClick={props.onBack}
      />
      <MenuDivider />
      {props.page.content()}
    </div>
  );
}

export default function MenuHost(props: { children: JSX.Element }) {
  const [pages, setPages] = createSignal<MenuPage[]>([]);
  const [width, setWidth] = createSignal(0);
  let root: HTMLDivElement | undefined;
  const depth = () => pages().length;

  function open(page: MenuPage) {
    setWidth(Math.max(width(), root?.offsetWidth ?? 0));
    setPages((current) => [...current, page]);
  }

  function back() {
    const left = pages().at(-1);
    setPages((current) => current.slice(0, -1));
    queueMicrotask(() => left?.opener?.focus());
  }

  createEffect(() => {
    if (depth() === 0) return;
    onCleanup(shortcuts.registerLocal("escape", back));
  });

  return (
    <MenuPages.Provider value={open}>
      <div
        ref={root}
        style={{ "--menu-width": `${width()}px` }}
        class="flex flex-col min-w-(--menu-width)"
      >
        <div class={depth() > 0 ? "hidden" : "flex flex-col"}>
          {props.children}
        </div>
        <For each={pages()}>
          {(page, index) => (
            <Page page={page} current={index() === depth() - 1} onBack={back} />
          )}
        </For>
      </div>
    </MenuPages.Provider>
  );
}
