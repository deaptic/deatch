import {
  type Fiber,
  type FiberRoot,
  liveFiber,
  mounted,
  searchTree,
} from "../../shared/react.ts";
import {
  type Apollo,
  apolloOf,
  type ClaimButton,
  isClaimButton,
  pointsOf,
  subscribedOf,
  type TwitchPoints,
} from "./twitch.ts";

const RESCAN_MIN_MS = 2000;
const RESCAN_MAX_MS = 30_000;

const WANTED = {
  button: (fiber: Fiber) =>
    isClaimButton(fiber.stateNode) ? fiber.stateNode : null,
  points: (fiber: Fiber) => (pointsOf(fiber.memoizedProps) ? fiber : null),
  client: (fiber: Fiber) => apolloOf(fiber.memoizedProps),
  subscription: (fiber: Fiber) =>
    subscribedOf(fiber.memoizedProps) !== null ? fiber : null,
};

export type Finder = ReturnType<typeof createFinder>;

export function createFinder() {
  let button: ClaimButton | null = null;
  let pointsFiber: Fiber | null = null;
  let client: Apollo | null = null;
  let subscriptionFiber: Fiber | null = null;
  let scannedAt = -Infinity;
  let gap = RESCAN_MIN_MS;

  function points(root: FiberRoot): TwitchPoints | null {
    const fiber = pointsFiber && liveFiber(pointsFiber, root);
    return fiber ? pointsOf(fiber.memoizedProps) : null;
  }

  function subscribed(root: FiberRoot): boolean | null {
    const fiber = subscriptionFiber && liveFiber(subscriptionFiber, root);
    return fiber ? subscribedOf(fiber.memoizedProps) : null;
  }

  function rescan(root: FiberRoot) {
    if (performance.now() - scannedAt < gap) return;
    scannedAt = performance.now();
    const found = searchTree(root.current, WANTED);
    button = found.button ?? button;
    pointsFiber = found.points ?? pointsFiber;
    client = found.client ?? client;
    subscriptionFiber = found.subscription ?? subscriptionFiber;
    const complete =
      found.button && found.points && found.client && found.subscription;
    gap = complete ? RESCAN_MIN_MS : Math.min(gap * 2, RESCAN_MAX_MS);
  }

  function hurry() {
    gap = RESCAN_MIN_MS;
    scannedAt = -Infinity;
  }

  return {
    points,
    subscribed,
    rescan,
    hurry,
    button: () => (mounted(button) ? button : null),
    client: () => client,
  };
}
