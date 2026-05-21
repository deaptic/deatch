// A tiny boolean DSL over a named flag map.
// Grammar:  expr := or
//           or   := and ("||" and)*
//           and  := not ("&&" not)*
//           not  := "!" not | primary
//           primary := identifier | "(" or ")"
//
// Pipeline: tokenize → parse → evaluate. The AST is plain data so it
// can be inspected, logged, or transformed without re-parsing.

export type FlagMap = Map<string, boolean>;
export type Predicate = (flags: FlagMap) => boolean;

type Expr =
  | { type: "ref"; name: string }
  | { type: "not"; expr: Expr }
  | { type: "and"; left: Expr; right: Expr }
  | { type: "or"; left: Expr; right: Expr };

type Token =
  | { type: "id"; value: string }
  | { type: "(" | ")" | "!" | "&&" | "||" };

const TOKEN_RE = /\s*(?:(&&)|(\|\|)|(!)|(\()|(\))|([a-zA-Z_][a-zA-Z0-9_:.-]*)|(\S))/g;

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  for (const m of src.matchAll(TOKEN_RE)) {
    if (m[1]) out.push({ type: "&&" });
    else if (m[2]) out.push({ type: "||" });
    else if (m[3]) out.push({ type: "!" });
    else if (m[4]) out.push({ type: "(" });
    else if (m[5]) out.push({ type: ")" });
    else if (m[6]) out.push({ type: "id", value: m[6] });
    else throw new Error(`unexpected character: ${m[7]}`);
  }
  return out;
}

function parse(tokens: Token[]): Expr {
  let i = 0;
  const eat = (t: Token["type"]): boolean =>
    tokens[i]?.type === t ? (i++, true) : false;

  const parseOr = (): Expr => {
    let left = parseAnd();
    while (eat("||")) left = { type: "or", left, right: parseAnd() };
    return left;
  };
  const parseAnd = (): Expr => {
    let left = parseNot();
    while (eat("&&")) left = { type: "and", left, right: parseNot() };
    return left;
  };
  const parseNot = (): Expr =>
    eat("!") ? { type: "not", expr: parseNot() } : parsePrimary();
  const parsePrimary = (): Expr => {
    const t = tokens[i++];
    if (!t) throw new Error("unexpected end of input");
    if (t.type === "(") {
      const inner = parseOr();
      if (!eat(")")) throw new Error("expected )");
      return inner;
    }
    if (t.type === "id") return { type: "ref", name: t.value };
    throw new Error(`unexpected token: ${t.type}`);
  };

  const expr = parseOr();
  if (i < tokens.length) throw new Error(`trailing tokens at ${i}`);
  return expr;
}

function evaluate(expr: Expr, flags: FlagMap): boolean {
  switch (expr.type) {
    case "ref": return !!flags.get(expr.name);
    case "not": return !evaluate(expr.expr, flags);
    case "and": return evaluate(expr.left, flags) && evaluate(expr.right, flags);
    case "or":  return evaluate(expr.left, flags) || evaluate(expr.right, flags);
  }
}

export function compile(src: string): Predicate {
  const ast = parse(tokenize(src));
  return (flags) => evaluate(ast, flags);
}
