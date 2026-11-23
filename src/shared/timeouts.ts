type Id = ReturnType<typeof setTimeout>;

export function createTimeouts() {
  const pending = new Set<Id>();
  return {
    after(ms: number, run: () => void): Id {
      const id = setTimeout(() => {
        pending.delete(id);
        run();
      }, ms);
      pending.add(id);
      return id;
    },
    cancel(id: Id) {
      clearTimeout(id);
      pending.delete(id);
    },
    clear() {
      for (const id of pending) clearTimeout(id);
      pending.clear();
    },
  };
}
