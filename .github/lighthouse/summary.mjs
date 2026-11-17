// Leser rapportene `lhci upload --target=filesystem` la i LHCI_OUTPUT_DIR og skriver en
// markdown-oppsummering til stdout (workflowen sender den til $GITHUB_STEP_SUMMARY).
// Alle tall er medianen av kjøringene per side — se docs/PERFORMANCE.md.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const config = require("./lighthouserc.cjs").ci;

const formFactor =
  process.env.LHCI_FORM_FACTOR === "desktop" ? "desktop" : "mobile";
const outputDir = config.upload.outputDir;
const TOP_OPPORTUNITIES = 3;

const METRICS = [
  { id: "largest-contentful-paint", label: "LCP", format: seconds },
  { id: "cumulative-layout-shift", label: "CLS", format: (v) => v.toFixed(3) },
  { id: "total-blocking-time", label: "TBT", format: millis },
];

function seconds(ms) {
  return `${(ms / 1000).toFixed(1)} s`;
}

function millis(ms) {
  return `${Math.round(ms)} ms`;
}

function median(values) {
  const sorted = values
    .filter((v) => typeof v === "number")
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function pathOf(url) {
  const { pathname } = new URL(url);
  return pathname === "" ? "/" : pathname;
}

/** Budsjettgrensene hentes fra assert-oppsettet, så de bare står ett sted. */
function budgetFor(id) {
  const options = config.assert.assertions[id]?.[1] ?? {};
  return { min: options.minScore, max: options.maxNumericValue };
}

function overBudget(id, value) {
  if (value === null) return false;
  const { min, max } = budgetFor(id);
  if (typeof min === "number" && value < min) return true;
  return typeof max === "number" && value > max;
}

/** Tiltakene Lighthouse mener sparer mest tid, fra én kjøring. */
function topOpportunities(lhr) {
  const found = [];
  for (const ref of lhr.categories.performance.auditRefs) {
    if (ref.group !== "insights" && ref.group !== "diagnostics") continue;
    const audit = lhr.audits[ref.id];
    if (!audit || audit.score === null || audit.score >= 0.9) continue;
    const savings = audit.metricSavings ?? {};
    const ms = Math.max(
      savings.LCP ?? 0,
      savings.FCP ?? 0,
      savings.TBT ?? 0,
      audit.details?.overallSavingsMs ?? 0
    );
    if (ms <= 0) continue;
    const detail = audit.displayValue ? ` (${audit.displayValue})` : "";
    found.push({ ms, text: `${audit.title}${detail} — ca. ${millis(ms)}` });
  }
  return found.sort((a, b) => b.ms - a.ms).slice(0, TOP_OPPORTUNITIES);
}

function loadRuns() {
  let manifest;
  try {
    manifest = readJson(join(outputDir, "manifest.json"));
  } catch {
    return null;
  }
  const byUrl = new Map();
  for (const entry of manifest) {
    const runs = byUrl.get(entry.url) ?? [];
    runs.push(readJson(entry.jsonPath));
    byUrl.set(entry.url, runs);
  }
  return byUrl;
}

function main() {
  const title = formFactor === "desktop" ? "Desktop" : "Mobil";
  const byUrl = loadRuns();
  if (!byUrl || byUrl.size === 0) {
    console.log(`## Lighthouse – ${title}\n`);
    console.log(
      `Fant ingen rapporter i \`${outputDir}\` — se loggen til målesteget.`
    );
    return;
  }

  const first = byUrl.values().next().value[0];
  const origin = new URL(first.finalDisplayedUrl ?? first.requestedUrl).origin;
  const runCount = Math.max(...[...byUrl.values()].map((runs) => runs.length));

  const rows = [];
  const warnings = [];
  const opportunities = [];

  for (const [url, runs] of byUrl) {
    const path = pathOf(url);
    const scores = runs
      .map((lhr) => lhr.categories.performance.score)
      .filter((score) => typeof score === "number");
    const score = median(scores);

    if (score === null) {
      const reason = runs[0].runtimeError?.message ?? "ukjent feil";
      rows.push(`| \`${path}\` | – | – | – | – | – |`);
      warnings.push(`\`${path}\`: ingen gyldig måling (${reason})`);
      continue;
    }

    const cells = [`\`${path}\``];
    const scoreFlag = overBudget("categories:performance", score) ? " ⚠️" : "";
    cells.push(`**${Math.round(score * 100)}**${scoreFlag}`);
    cells.push(
      `${Math.round(Math.min(...scores) * 100)}–${Math.round(Math.max(...scores) * 100)}`
    );
    if (scoreFlag) {
      const { min } = budgetFor("categories:performance");
      warnings.push(
        `\`${path}\`: ytelse ${Math.round(score * 100)} (mål: minst ${Math.round(min * 100)})`
      );
    }

    for (const metric of METRICS) {
      const value = median(
        runs.map((lhr) => lhr.audits[metric.id]?.numericValue)
      );
      if (value === null) {
        cells.push("–");
        continue;
      }
      const flagged = overBudget(metric.id, value);
      cells.push(`${metric.format(value)}${flagged ? " ⚠️" : ""}`);
      if (flagged) {
        const { max } = budgetFor(metric.id);
        warnings.push(
          `\`${path}\`: ${metric.label} ${metric.format(value)} (mål: maks ${metric.format(max)})`
        );
      }
    }
    rows.push(`| ${cells.join(" | ")} |`);

    // Tiltakene hentes fra kjøringen som ligger nærmest median-scoren.
    const representative = runs
      .filter((lhr) => typeof lhr.categories.performance.score === "number")
      .sort(
        (a, b) =>
          Math.abs(a.categories.performance.score - score) -
          Math.abs(b.categories.performance.score - score)
      )[0];
    opportunities.push({ path, items: topOpportunities(representative) });
  }

  console.log(`## Lighthouse – ${title}\n`);
  console.log(
    `${origin} · median av ${runCount} kjøringer per side · Lighthouse ${first.lighthouseVersion}\n`
  );
  console.log("| Side | Ytelse | Spredning | LCP | CLS | TBT |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  console.log(rows.join("\n"));

  console.log("");
  if (warnings.length > 0) {
    console.log("**Utenfor budsjettet (kun varsel, stopper ingenting):**\n");
    for (const warning of warnings) console.log(`- ${warning}`);
  } else {
    console.log("Alle sidene er innenfor budsjettet.");
  }

  console.log("\n<details><summary>Største forbedringsmuligheter</summary>\n");
  for (const { path, items } of opportunities) {
    console.log(`**\`${path}\`**\n`);
    if (items.length === 0) {
      console.log("- Ingen tiltak med målbar tidsgevinst.");
    }
    for (const item of items) console.log(`- ${item.text}`);
    console.log("");
  }
  console.log("</details>\n");
}

main();
