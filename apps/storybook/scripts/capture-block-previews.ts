/**
 * Skyter forhåndsvisningsbilder til blokkvelgeren i Payload.
 *
 * For hver blokk i `apps/web/blocks/block-previews.ts` finner scriptet den
 * tilhørende Storybook-storyen, åpner den i en headless nettleser og lagrer et
 * skjermbilde i `apps/web/public/block-previews/<slug>.jpg`. Payload viser bildet
 * på blokk-kortet i «Legg til blokk»-skuffen.
 *
 * Kjør fra rota:  bun run block-previews
 * (bygger Storybook først — se `block-previews`-scriptet i apps/storybook)
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Puppeteer, ikke Playwright: Playwrights `--remote-debugging-pipe`-transport
// henger under Bun på Windows.
import puppeteer from "puppeteer";
import { blockPreviews } from "../../web/blocks/block-previews";

const here = dirname(fileURLToPath(import.meta.url));
const staticDir = resolve(here, "../storybook-static");
const outDir = resolve(here, "../../web/public/block-previews");

// Bredt nok til at 3-kolonners rutenett ser ut som på desktop, og lavt nok til
// at kortet i skuffen får et rolig 16:10-utsnitt.
const VIEWPORT = { width: 1280, height: 800 };
// Nedre grense så veldig korte blokker ikke blir en tynn stripe i skuffen.
const MIN_CAPTURE_HEIGHT = 360;
// Reveal/Stagger/CountUp animerer inn — vent til de har landet før vi skyter.
const SETTLE_MS = 1500;

interface IndexEntry {
  id: string;
  title: string;
  name: string;
  type: string;
}

if (!existsSync(join(staticDir, "index.json"))) {
  console.error(
    `Fant ikke ${join(staticDir, "index.json")}.
Bygg Storybook først: bun run --cwd apps/storybook build-storybook`
  );
  process.exit(1);
}

const index = (await Bun.file(join(staticDir, "index.json")).json()) as {
  entries: Record<string, IndexEntry>;
};
const entries = Object.values(index.entries).filter((e) => e.type === "story");

// Statisk server foran storybook-static — iframe.html laster JS/CSS relativt,
// så filene må serveres over HTTP (file:// virker ikke).
const server = Bun.serve({
  port: 0,
  async fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    // Ingen sti-rømming ut av storybook-static.
    const safe = normalize(path).replace(/^(\.\.[/\\])+/, "");
    const file = Bun.file(join(staticDir, safe));
    // Chrome ber alltid om /favicon.ico — svar 404 i stedet for å støye.
    if (!(await file.exists()))
      return new Response("Not found", { status: 404 });
    return new Response(file);
  },
});
const base = `http://localhost:${server.port}`;

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

let captured = 0;
const missing: string[] = [];

for (const [slug, preview] of Object.entries(blockPreviews)) {
  // Første story under tittelen er «hovedvarianten» i alle Blokker-filene.
  const entry = entries.find((e) => e.title === preview.story);
  if (!entry) {
    missing.push(`${slug} → ingen story med tittel «${preview.story}»`);
    continue;
  }

  await page.goto(`${base}/iframe.html?id=${entry.id}&viewMode=story`, {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector("#storybook-root > *", { timeout: 15_000 });
  await new Promise((r) => setTimeout(r, SETTLE_MS));

  // Klipp til innholdets faktiske høyde, ellers får korte blokker (CTA,
  // logostripe) et halvt bilde med tom bakgrunn under seg.
  const contentHeight = await page.evaluate(
    () => document.querySelector("#storybook-root")?.scrollHeight ?? 0
  );
  const height = Math.min(
    VIEWPORT.height,
    Math.max(MIN_CAPTURE_HEIGHT, contentHeight)
  );

  const out = join(outDir, `${slug}.jpg`);
  await page.screenshot({
    path: out,
    type: "jpeg",
    quality: 80,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height },
  });
  captured++;
  console.log(`✓ ${slug}  (${entry.title} / ${entry.name})`);
}

await browser.close();
server.stop(true);

if (missing.length > 0) {
  console.warn(`\nHoppet over ${missing.length}:`);
  for (const line of missing) console.warn(`  ! ${line}`);
}
console.log(`\n${captured} forhåndsvisninger skrevet til ${outDir}`);
if (missing.length > 0) process.exit(1);
