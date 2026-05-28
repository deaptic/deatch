import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  useContext,
  type JSX,
} from "solid-js";

export type NavigationOrientation = "horizontal" | "vertical";

type NavigationContextValue = {
  orientation: () => NavigationOrientation;
  fill: () => boolean;
  register: (el: HTMLButtonElement, active: () => boolean) => void;
  unregister: (el: HTMLButtonElement) => void;
};

const NavigationContext = createContext<NavigationContextValue>();

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("NavigationItem must be used inside Navigation");
  return ctx;
}

export function useNavigationOptional(): NavigationContextValue | undefined {
  return useContext(NavigationContext);
}

type Props = {
  orientation?: NavigationOrientation;
  fill?: boolean;
  indicatorClass?: string;
  scroll?: boolean;
  children: JSX.Element;
  class?: string;
};

const ARROW_CLASS =
  "shrink-0 flex items-center justify-center px-2 text-text-muted hover:text-text cursor-pointer";

export default function Navigation(props: Props) {
  const orientation = (): NavigationOrientation =>
    props.orientation ?? "horizontal";
  const horizontal = () => orientation() === "horizontal";
  const fill = () => !!props.fill;
  const scroll = () => props.scroll !== false;

  const [canScrollStart, setCanScrollStart] = createSignal(false);
  const [canScrollEnd, setCanScrollEnd] = createSignal(false);
  const [tick, setTick] = createSignal(0);
  const registry = new Map<HTMLButtonElement, () => boolean>();
  let scrollEl: HTMLDivElement | undefined;

  const register = (el: HTMLButtonElement, active: () => boolean) => {
    registry.set(el, active);
    setTick((t) => t + 1);
  };
  const unregister = (el: HTMLButtonElement) => {
    registry.delete(el);
    setTick((t) => t + 1);
  };

  const activeMetrics = createMemo(() => {
    tick();
    let active: HTMLButtonElement | null = null;
    for (const [el, isActive] of registry) {
      if (isActive()) {
        active = el;
        break;
      }
    }
    if (!active || !scrollEl) return null;
    const a = active.getBoundingClientRect();
    const c = scrollEl.getBoundingClientRect();
    return {
      left: a.left - c.left + scrollEl.scrollLeft,
      top: a.top - c.top + scrollEl.scrollTop,
      width: a.width,
      height: a.height,
    };
  });

  const updateOverflow = () => {
    const el = scrollEl;
    if (!el) return;
    const start = horizontal() ? el.scrollLeft : el.scrollTop;
    const viewport = horizontal() ? el.clientWidth : el.clientHeight;
    const content = horizontal() ? el.scrollWidth : el.scrollHeight;
    setCanScrollStart(start > 0);
    setCanScrollEnd(start + viewport < content - 1);
  };

  const scrollStep = (direction: -1 | 1) => {
    const el = scrollEl;
    if (!el) return;
    const viewport = horizontal() ? el.clientWidth : el.clientHeight;
    el.scrollBy({
      [horizontal() ? "left" : "top"]: viewport * 0.7 * direction,
      behavior: "smooth",
    });
  };

  onMount(() => {
    const el = scrollEl;
    if (!el) return;
    updateOverflow();
    el.addEventListener("scroll", updateOverflow, { passive: true });
    const ro = new ResizeObserver(() => {
      updateOverflow();
      setTick((t) => t + 1);
    });
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    onCleanup(() => {
      el.removeEventListener("scroll", updateOverflow);
      ro.disconnect();
    });
  });

  return (
    <NavigationContext.Provider
      value={{ orientation, fill, register, unregister }}
    >
      <div
        class={`flex items-stretch ${
          horizontal() ? "flex-row" : "flex-col"
        } ${props.class ?? ""}`}
      >
        <Show when={scroll() && canScrollStart()}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => scrollStep(-1)}
            class={ARROW_CLASS}
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              class="w-3 h-3"
              style={{ transform: `rotate(${horizontal() ? 90 : 180}deg)` }}
            >
              <path d="M8 12L2 6h12z" />
            </svg>
          </button>
        </Show>

        <div
          ref={scrollEl}
          class={`relative flex min-w-0 min-h-0 flex-1 ${
            horizontal() ? "flex-row" : "flex-col"
          } ${
            scroll()
              ? `${horizontal() ? "overflow-x-auto" : "overflow-y-auto"} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
              : ""
          }`}
        >
          {props.children}
          <Show when={activeMetrics()}>
            {(m) => (
              <span
                aria-hidden
                class={`pointer-events-none absolute transition-all duration-200 ease-out z-10 ${
                  props.indicatorClass ?? "bg-primary rounded-full"
                }`}
                style={
                  horizontal()
                    ? {
                        left: `${m().left}px`,
                        top: `${m().top + m().height - 4}px`,
                        width: `${m().width}px`,
                        height: "4px",
                      }
                    : {
                        left: `${m().left}px`,
                        top: `${m().top + m().height / 6}px`,
                        width: "4px",
                        height: `${(m().height * 2) / 3}px`,
                      }
                }
              />
            )}
          </Show>
        </div>

        <Show when={scroll() && canScrollEnd()}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => scrollStep(1)}
            class={ARROW_CLASS}
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              class="w-3 h-3"
              style={{ transform: `rotate(${horizontal() ? -90 : 0}deg)` }}
            >
              <path d="M8 12L2 6h12z" />
            </svg>
          </button>
        </Show>
      </div>
    </NavigationContext.Provider>
  );
}
