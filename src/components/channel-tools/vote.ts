/// Twitch's limits for each kind of vote a broadcaster can start.
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

/// Voting time for a poll, or the window to predict, in seconds.
export const VOTE_DURATIONS = [60, 120, 300, 600] as const;
export const DEFAULT_DURATION = 120;

/// The options a vote would start with: filled ones, trimmed.
export function filledOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter(Boolean);
}

export function canStartVote(question: string, options: string[]): boolean {
  return (
    question.trim().length > 0 && filledOptions(options).length >= MIN_OPTIONS
  );
}
