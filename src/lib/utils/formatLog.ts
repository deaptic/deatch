export function formatLog(args: unknown[]): string {
  return args.map(formatValue).join(" ");
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }
  if (value === undefined || typeof value === "function") return String(value);
  try {
    return JSON.stringify(value, logReplacer());
  } catch {
    return `[unserializable ${typeName(value)}]`;
  }
}

/// Makes errors, bigints and cycles printable. Only an object among its own
/// ancestors is a cycle; the same object twice side by side prints twice.
function logReplacer() {
  const ancestors: unknown[] = [];
  return function (this: unknown, _key: string, value: unknown): unknown {
    if (typeof value === "bigint") return `${value}n`;
    if (value instanceof Error) {
      return { name: value.name, message: value.message };
    }
    if (typeof value !== "object" || value === null) return value;
    while (ancestors.length > 0 && ancestors.at(-1) !== this) ancestors.pop();
    if (ancestors.includes(value)) return "[Circular]";
    ancestors.push(value);
    return value;
  };
}

function typeName(value: unknown): string {
  if (value === null || typeof value !== "object") return typeof value;
  // Objects made with Object.create(null) have no constructor.
  const constructor: unknown = value.constructor;
  return typeof constructor === "function" ? constructor.name : "Object";
}
