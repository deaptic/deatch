export type ChannelHooks = {
  join?: (broadcasterId: string) => void;
  focus?: (broadcasterId: string) => void;
  leave?: (broadcasterId: string) => void;
};

type Step = keyof ChannelHooks;

function call(hooks: ChannelHooks, step: Step, broadcasterId: string) {
  try {
    hooks[step]?.(broadcasterId);
  } catch (e) {
    console.error(`channel ${step} failed`, { broadcasterId, error: e });
  }
}

export function createHooks() {
  const all = new Set<ChannelHooks>();
  return {
    add(hooks: ChannelHooks, joined: Iterable<string>): () => void {
      all.add(hooks);
      for (const id of joined) call(hooks, "join", id);
      return () => all.delete(hooks);
    },
    run(step: Step, broadcasterId: string) {
      for (const hooks of all) call(hooks, step, broadcasterId);
    },
  };
}
