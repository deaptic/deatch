import { gridStep } from "../../lib/utils/gridStep.ts";

const columnsOf = (items: HTMLElement[]) =>
  items.filter((el) => el.offsetTop === items[0]?.offsetTop).length;

export function moveGridFocus(
  e: KeyboardEvent & { currentTarget: HTMLElement },
) {
  const items = Array.from(e.currentTarget.children) as HTMLElement[];
  const index = items.findIndex((el) => el === e.target);
  if (index === -1) return;
  const next = gridStep(index, e.key, columnsOf(items), items.length);
  if (next === null) return;
  e.preventDefault();
  items[next]?.focus();
}
