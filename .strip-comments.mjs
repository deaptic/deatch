import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const KEEP =
  /@refresh|eslint|oxlint|@ts-|prettier-ignore|biome-ignore|@vite-ignore|@license/;

function files(dir, exts) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : files(p, exts);
    return exts.includes(path.extname(e.name)) ? [p] : [];
  });
}

function strip(file) {
  const text = fs.readFileSync(file, "utf8");
  const kind = file.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : file.endsWith(".js")
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const shielded = [];
  const ranges = new Map();
  const visit = (node) => {
    if (
      node.kind === ts.SyntaxKind.JsxText ||
      ts.isStringLiteralLike(node) ||
      node.kind === ts.SyntaxKind.TemplateHead ||
      node.kind === ts.SyntaxKind.TemplateMiddle ||
      node.kind === ts.SyntaxKind.TemplateTail ||
      node.kind === ts.SyntaxKind.RegularExpressionLiteral
    ) {
      shielded.push([node.getStart(sf), node.end]);
      return;
    }
    for (const r of ts.getLeadingCommentRanges(text, node.pos) ?? [])
      ranges.set(r.pos, r);
    for (const r of ts.getTrailingCommentRanges(text, node.end) ?? [])
      ranges.set(r.pos, r);
    for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);
  const cuts = [...ranges.values()]
    .filter((r) => !shielded.some(([s, e]) => r.pos < e && r.end > s))
    .filter((r) => !KEEP.test(text.slice(r.pos, r.end)))
    .sort((a, b) => b.pos - a.pos);
  if (cuts.length === 0) return 0;
  let out = text;
  for (const r of cuts) {
    const lineStart = out.lastIndexOf("\n", r.pos - 1) + 1;
    let lineEnd = out.indexOf("\n", r.end);
    if (lineEnd === -1) lineEnd = out.length;
    const before = out.slice(lineStart, r.pos);
    const after = out.slice(r.end, lineEnd);
    if (before.trim() === "" && after.trim() === "") {
      out =
        out.slice(0, lineStart) + out.slice(Math.min(lineEnd + 1, out.length));
    } else {
      out = out.slice(0, r.pos).replace(/[ \t]+$/, "") + out.slice(r.end);
    }
  }
  fs.writeFileSync(file, out);
  return cuts.length;
}

const targets = [
  ...files("src", [".ts", ".tsx"]).filter((f) => !f.endsWith("bindings.ts")),
  ...files("scripts", [".ts", ".mjs", ".js"]),
  ...files("extension", [".js"]),
];
let total = 0,
  touched = 0;
for (const f of targets) {
  const n = strip(f);
  if (n) {
    total += n;
    touched++;
  }
}
console.log(`removed ${total} comments in ${touched} files`);
