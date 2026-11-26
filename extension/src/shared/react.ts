import { asRecord } from "./record.ts";

export type Fiber = {
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
  stateNode: unknown;
  memoizedProps: unknown;
};

export type FiberRoot = { current: Fiber };

type Picks = Record<string, unknown>;
type Wanted<T extends Picks> = {
  [K in keyof T]: (fiber: Fiber) => T[K] | null;
};
type Found<T extends Picks> = { [K in keyof T]: T[K] | null };

export function fiberRoot(): FiberRoot | null {
  const root = document.getElementById("root");
  if (!root) return null;
  const fields = asRecord(root);
  const key = Object.keys(root).find((k) => k.startsWith("__reactContainer$"));
  const found = key
    ? asRecord(fields[key]).stateNode
    : asRecord(fields._reactRootContainer)._internalRoot;
  return (found as FiberRoot | undefined) ?? null;
}

function inTree(fiber: Fiber, root: FiberRoot) {
  let node = fiber;
  while (node.return) node = node.return;
  return node === root.current;
}

export function liveFiber(fiber: Fiber, root: FiberRoot): Fiber | null {
  const live = inTree(fiber, root) ? fiber : fiber.alternate;
  return live && inTree(live, root) ? live : null;
}

export function mounted(node: unknown): boolean {
  const isMounted = asRecord(asRecord(node).updater).isMounted;
  return typeof isMounted === "function" && isMounted(node) === true;
}

export function searchTree<T extends Picks>(
  top: Fiber,
  wanted: Wanted<T>,
): Found<T> {
  const keys = Object.keys(wanted) as (keyof T)[];
  const found = Object.fromEntries(keys.map((key) => [key, null])) as Found<T>;
  const missing = () => keys.some((key) => found[key] === null);
  const stack = [top];
  for (let fiber = stack.pop(); fiber && missing(); fiber = stack.pop()) {
    for (const key of keys) found[key] ??= wanted[key](fiber);
    if (fiber.sibling && fiber !== top) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
  return found;
}
