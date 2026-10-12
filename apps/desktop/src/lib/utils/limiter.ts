export type Task = () => Promise<unknown>;

export function createLimiter(limit: number) {
  const queue: Task[] = [];
  let running = 0;

  function next() {
    while (running < limit) {
      const task = queue.shift();
      if (!task) return;
      running++;
      task()
        .catch((e) => console.error("limited task failed", e))
        .finally(() => {
          running--;
          next();
        });
    }
  }

  return (task: Task, urgent = false) => {
    if (urgent) queue.unshift(task);
    else queue.push(task);
    next();
  };
}
