const PREFIX = "Deatch Link:";

export const log = {
  warn: (message: string, ...details: unknown[]) =>
    console.warn(PREFIX, message, ...details),
  error: (message: string, ...details: unknown[]) =>
    console.error(PREFIX, message, ...details),
};
