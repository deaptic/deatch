export type VoteKind = "poll" | "prediction";

export const VOTE_LIMITS: Record<
  VoteKind,
  { titleLength: number; options: number }
> = {
  poll: { titleLength: 60, options: 5 },
  prediction: { titleLength: 45, options: 10 },
};

export const MIN_OPTIONS = 2;
export const OPTION_LENGTH = 25;

export const VOTE_DURATIONS = [60, 120, 300, 600] as const;
export const DEFAULT_DURATION = 120;

export function filledOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter(Boolean);
}

export function canStartVote(question: string, options: string[]): boolean {
  return (
    question.trim().length > 0 && filledOptions(options).length >= MIN_OPTIONS
  );
}
