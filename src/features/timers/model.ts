type TimerSettings = {
  enabled: boolean;
  message: string;
  minutes: number;
  minMessages: number;
};

export type TimerRun = { lastPostedAt: number; messagesSince: number };

export function isDue(
  timer: TimerSettings,
  run: TimerRun,
  now: number,
): boolean {
  return (
    timer.enabled &&
    timer.message.trim() !== "" &&
    now - run.lastPostedAt >= timer.minutes * 60_000 &&
    run.messagesSince >= timer.minMessages
  );
}
