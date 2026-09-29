/**
 * Vakt for tekststørrelser og tekstkontrast i Tailwind-klasser.
 *
 * Stopper tre mønstre som gir ujevn typografi eller for lav kontrast:
 *   1. Vilkårlige tekststørrelser — `text-[13px]`, `text-[0.8rem]`.
 *      Bruk skalaen (text-xs/sm/base/lg/…) eller et navngitt token.
 *   2. Gjennomskinnelig tekstfarge — `text-foreground/70`, `hover:text-primary/80`.
 *      Bruk en hel farge (text-foreground, text-muted-foreground, …).
 *   3. Delvis opacity uten tilstand — `opacity-60`. Demper alt inni, også
 *      tekst. Tilstander (`disabled:opacity-50`, `group-hover:opacity-100`) er ok.
 *
 * Bevisste unntak (dekorative tall, bakgrunnsformer, ikoner, bilder) merkes med
 * en kommentar som inneholder `design-unntak:` + grunn, på samme linje eller
 * inntil tre linjer over.
 *
 * Kjør: `bun run check:tokens` (fra rot). Kjøres også i CI.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../..");
const SCAN_DIRS = ["apps/web", "apps/storybook", "packages"];
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "storybook-static",
  "(payload)",
]);
const EXTENSIONS = new Set([".tsx", ".ts"]);
const MARKER = "design-unntak:";
const MARKER_LOOKBACK = 3;

const RULES = [
  {
    name: "vilkårlig tekststørrelse",
    hint: "bruk text-xs/sm/base/lg/… fra skalaen",
    pattern: /(?<![\w-])(?:[\w-]+:)*text-\[\d*\.?\d+(?:px|rem|em)\]/g,
  },
  {
    name: "gjennomskinnelig tekstfarge",
    hint: "bruk en hel farge, f.eks. text-muted-foreground",
    pattern: /(?<![\w-])(?:[\w\-[\]&=]+:)*text-[a-z][\w-]*\/\d+(?![\w-])/g,
  },
  {
    name: "delvis opacity",
    hint: "bruk en hel farge, eller merk med «design-unntak:» hvis dekorativt",
    pattern: /(?<![\w:-])opacity-(?:[1-9]|[1-9][0-9])(?![\w-])/g,
  },
];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (
      EXTENSIONS.has(path.extname(entry)) &&
      !entry.endsWith(".d.ts")
    ) {
      yield full;
    }
  }
}

const violations: string[] = [];

for (const scanDir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, scanDir))) {
    // Vakta selv beskriver mønstrene den leter etter.
    if (file === import.meta.path) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    for (const [index, line] of lines.entries()) {
      const context = lines
        .slice(Math.max(0, index - MARKER_LOOKBACK), index + 1)
        .join("\n");
      if (context.includes(MARKER)) continue;
      for (const rule of RULES) {
        for (const match of line.matchAll(rule.pattern)) {
          const where = `${path.relative(ROOT, file).replaceAll("\\", "/")}:${index + 1}`;
          violations.push(
            `${where}  ${match[0]}  — ${rule.name} (${rule.hint})`
          );
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  console.error(
    `\n${violations.length} brudd. Merk bevisste unntak med «${MARKER} <grunn>».`
  );
  process.exit(1);
}

console.log("Tekststørrelser og tekstkontrast: ingen brudd.");
