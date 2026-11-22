export type Piece =
  | { kind: "text"; text: string }
  | { kind: "method"; name: string; arg: string | null; raw: string };

export type ArgRule = "none" | "optional" | "required";

export type MethodSpec = {
  name: string;
  arg: ArgRule;
  validArg?: (arg: string) => boolean;
};

export type Problem = {
  kind: "unknown" | "missingArg" | "unexpectedArg" | "badArg";
  raw: string;
};

const METHOD = /\{([a-z]+)(?::([^{}]*))?\}/g;
const QUERY = /\{([a-z]*)$/;

export function parse(template: string): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;
  for (const match of template.matchAll(METHOD)) {
    const [raw, name = "", arg] = match;
    if (match.index > last) {
      pieces.push({ kind: "text", text: template.slice(last, match.index) });
    }
    pieces.push({ kind: "method", name, arg: arg ?? null, raw });
    last = match.index + raw.length;
  }
  if (last < template.length) {
    pieces.push({ kind: "text", text: template.slice(last) });
  }
  return pieces;
}

function problemOf(
  piece: Extract<Piece, { kind: "method" }>,
  specs: readonly MethodSpec[],
): Problem["kind"] | null {
  const spec = specs.find((s) => s.name === piece.name);
  if (!spec) return "unknown";
  if (piece.arg === null) return spec.arg === "required" ? "missingArg" : null;
  if (spec.arg === "none") return "unexpectedArg";
  return spec.validArg && !spec.validArg(piece.arg) ? "badArg" : null;
}

export function problems(
  pieces: Piece[],
  specs: readonly MethodSpec[],
): Problem[] {
  return pieces.flatMap((piece) => {
    if (piece.kind === "text") return [];
    const kind = problemOf(piece, specs);
    return kind ? [{ kind, raw: piece.raw }] : [];
  });
}

export async function render(
  pieces: Piece[],
  resolve: (name: string, arg: string | null) => Promise<string>,
): Promise<string> {
  const parts = await Promise.all(
    pieces.map((piece) =>
      piece.kind === "text"
        ? Promise.resolve(piece.text)
        : resolve(piece.name, piece.arg).catch((e: unknown) => {
            console.warn(`trigger method ${piece.raw} failed`, e);
            return "";
          }),
    ),
  );
  return parts.join("");
}

export function methodQueryAt(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const match = QUERY.exec(text.slice(0, caret));
  return match ? { start: match.index, query: match[1] ?? "" } : null;
}
