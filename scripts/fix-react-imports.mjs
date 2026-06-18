import fs from "fs";
import path from "path";

const root = process.cwd();
const hooks = ["useCallback", "useEffect", "useMemo", "useRef", "useState"];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(p);
  }
  return files;
}

const bulkImportRe =
  /import\s*\{\s*useCallback,\s*useEffect,\s*useMemo,\s*useRef,\s*useState\s*\}\s*from\s*"react";?\s*\n/;

let fixed = 0;
for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  if (!bulkImportRe.test(src)) continue;

  const body = src.replace(bulkImportRe, "");
  const used = hooks.filter((h) => new RegExp(`\\b${h}\\b`).test(body));
  let replacement = "";
  if (used.length > 0) {
    replacement = `import { ${used.join(", ")} } from "react";\n`;
  }
  const next = src.replace(bulkImportRe, replacement);
  if (next !== src) {
    fs.writeFileSync(file, next);
    fixed++;
    console.log(file.replace(root + path.sep, ""), used.length ? used.join(",") : "removed");
  }
}
console.log("fixed files:", fixed);
