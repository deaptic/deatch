import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { zoomPlacement } from "./placement.ts";

/// While Ctrl is held, any hovered element carrying `data-zoom-src` shows
/// that image enlarged beside it, or `data-zoom-fallback` if it fails to
/// load. One delegated listener serves every image.
export default function HoverZoom() {
  const [ctrl, setCtrl] = createSignal(false);
  const [target, setTarget] = createSignal<HTMLElement | null>(null);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Control") setCtrl(e.type === "keydown");
  };
  const onOver = (e: MouseEvent) => {
    setCtrl(e.ctrlKey);
    setTarget((e.target as Element).closest<HTMLElement>("[data-zoom-src]"));
  };
  const release = () => setCtrl(false);
  const clear = () => setTarget(null);
  // Only a scroll that moves the hovered image hides it; a busy feed
  // elsewhere keeps scrolling while you look at the rail.
  const onScroll = (e: Event) => {
    const anchor = target();
    if (anchor && (e.target as Node).contains(anchor)) clear();
  };

  onMount(() => {
    const root = document.documentElement;
    globalThis.addEventListener("keydown", onKey);
    globalThis.addEventListener("keyup", onKey);
    globalThis.addEventListener("blur", release);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("scroll", onScroll, true);
    root.addEventListener("mouseleave", clear);
    onCleanup(() => {
      globalThis.removeEventListener("keydown", onKey);
      globalThis.removeEventListener("keyup", onKey);
      globalThis.removeEventListener("blur", release);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("scroll", onScroll, true);
      root.removeEventListener("mouseleave", clear);
    });
  });

  return (
    <Show when={ctrl() && target()} keyed>
      {(anchor) => <ZoomImage anchor={anchor} />}
    </Show>
  );
}

function ZoomImage(props: { anchor: HTMLElement }) {
  let ref: HTMLImageElement | undefined;
  const [pos, setPos] = createSignal<{ x: number; y: number } | null>(null);
  const [src, setSrc] = createSignal(props.anchor.dataset.zoomSrc);

  // Images show at their own size up to the cap, so emotes are not blown up
  // to avatar size; placement waits for the loaded size.
  const place = () => {
    if (!ref) return;
    setPos(
      zoomPlacement(
        props.anchor.getBoundingClientRect(),
        { width: ref.offsetWidth, height: ref.offsetHeight },
        { width: globalThis.innerWidth, height: globalThis.innerHeight },
      ),
    );
  };

  return (
    <Portal>
      <img
        ref={ref}
        src={src()}
        alt=""
        onLoad={place}
        onError={() => {
          const fallback = props.anchor.dataset.zoomFallback;
          if (fallback && src() !== fallback) setSrc(fallback);
        }}
        style={{ "--x": `${pos()?.x ?? 0}px`, "--y": `${pos()?.y ?? 0}px` }}
        class={`pointer-events-none fixed left-(--x) top-(--y) z-50 max-w-100 max-h-100 rounded-md border border-line bg-overlay ${
          pos() ? "" : "invisible"
        }`}
      />
    </Portal>
  );
}
