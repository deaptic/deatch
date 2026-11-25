import { REDUCED_MOTION } from "../../shared/accessibility.ts";

export type Spot = { top: number; left: number; width: number };
export type Motion = { duration: number; easing: string };

const glides = new WeakMap<HTMLElement, Animation>();

const shiftOf = (el: HTMLElement) =>
  new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;

export function measure(elements: Map<string, HTMLElement>): Map<string, Spot> {
  const spots = new Map<string, Spot>();
  for (const [key, el] of elements) {
    spots.set(key, {
      top: el.offsetTop + shiftOf(el),
      left: el.offsetLeft,
      width: parseFloat(getComputedStyle(el).width),
    });
  }
  return spots;
}

function slide(el: HTMLElement, shift: number, motion: Motion) {
  glides.get(el)?.cancel();
  if (Math.abs(shift) < 0.5) return;
  glides.set(
    el,
    el.animate(
      [{ transform: `translateY(${shift}px)` }, { transform: "none" }],
      motion,
    ),
  );
}

export function glide(
  elements: Map<string, HTMLElement>,
  before: Map<string, Spot>,
  skip: ReadonlySet<string>,
  motion: Motion,
): void {
  if (matchMedia(REDUCED_MOTION).matches) return;
  const moving = [...elements].filter(([key]) => !skip.has(key));
  const pushed = moving.reduce((widest, [key, el]) => {
    const from = before.get(key);
    const shift = from ? from.top - el.offsetTop : 0;
    return Math.abs(shift) > Math.abs(widest) ? shift : widest;
  }, 0);
  for (const [key, el] of moving) {
    const from = before.get(key);
    slide(el, from ? from.top - el.offsetTop : pushed, motion);
  }
}
