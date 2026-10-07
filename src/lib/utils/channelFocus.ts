import type { Focus } from "../types/index.ts";

export type FocusSources = {
  ownId: string;
  pinnedIds: string[];
  warmedIds: string[];
  selectedId: string | undefined;
  liveIds: string[];
};

export type FocusDiff = {
  added: string[];
  removed: string[];
  promoted: string[];
  changed: boolean;
};

export function channelFocus(sources: FocusSources): Map<string, Focus> {
  const focus = new Map<string, Focus>();
  for (const id of sources.liveIds) focus.set(id, "background");
  const focusedIds = [
    sources.ownId,
    ...sources.pinnedIds,
    ...sources.warmedIds,
    ...(sources.selectedId ? [sources.selectedId] : []),
  ];
  for (const id of focusedIds) focus.set(id, "focused");
  return focus;
}

export function diffFocus(
  prev: ReadonlyMap<string, Focus>,
  next: ReadonlyMap<string, Focus>,
): FocusDiff {
  const added = [...next.keys()].filter((id) => !prev.has(id));
  const removed = [...prev.keys()].filter((id) => !next.has(id));
  const promoted = [...next].filter(([id, focus]) =>
    focus === "focused" && prev.get(id) === "background"
  ).map(([id]) => id);
  const demoted = [...next].some(([id, focus]) =>
    focus === "background" && prev.get(id) === "focused"
  );
  return {
    added,
    removed,
    promoted,
    changed: added.length > 0 || removed.length > 0 || promoted.length > 0 ||
      demoted,
  };
}
