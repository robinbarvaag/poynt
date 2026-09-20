/**
 * MIDLERTIDIG (ikke commit): skjermbilder av «Påmeldte»-fanen på testeventet.
 * Åpner et synlig vindu — logg inn der. Legger til en anonymisert rad og en
 * venteliste-rad med svar KUN i nettleserens svar (databasen røres ikke).
 *
 *   bun apps/web/scripts/tmp-screenshot-registrations.ts <utmappe>
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import puppeteer from "puppeteer";

const outDir = process.argv[2] ?? ".";
const base = "http://localhost:3000";
const eventId = 4;
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  userDataDir: join(outDir, "chrome-profil"),
  args: ["--window-size=1500,1000"],
});
const [page] = await browser.pages();
page.on("dialog", (d) => d.dismiss());

// Utvid admin-oversikten med rader vi ikke har i databasen.
await page.evaluateOnNewDocument((id: number) => {
  const realFetch = window.fetch.bind(window);
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await realFetch(input, init);
    const url =
      typeof input === "string"
        ? input
        : String((input as Request).url ?? input);
    if (!url.includes(`/api/eventer/admin/${id}`) || url.includes("/csv"))
      return res;
    const data = await res.clone().json();
    const q = data.event.questions[0]?.name;
    data.rows.push(
      {
        id: 9001,
        name: "Slettet",
        email: "pamelding-9001@slettet.invalid",
        status: "checked_in",
        code: "SLETTET-9001",
        newsletter: false,
        answers: {},
        waitlistPosition: null,
        createdAt: "2026-03-02T10:00:00Z",
        checkedInAt: "2026-03-10T17:05:00Z",
        cancelledAt: null,
        cancelledBy: null,
        promotedAt: null,
      },
      {
        id: 9002,
        name: "Kari Nordmann-Langnavn",
        email: "kari.nordmann.med.lang.adresse@eksempel.no",
        status: "waitlisted",
        code: "POY-TEST",
        newsletter: true,
        answers: q
          ? { [q]: "Glutenfri, og litt nøtteallergi. Sitter helst nær døra." }
          : {},
        waitlistPosition: 1,
        createdAt: "2026-09-14T20:00:00Z",
        checkedInAt: null,
        cancelledAt: null,
        cancelledBy: null,
        promotedAt: null,
      }
    );
    data.counts.waitlisted += 1;
    data.counts.checked_in += 1;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}, eventId);

await page.goto(`${base}/admin/collections/events/${eventId}`, {
  waitUntil: "domcontentloaded",
});
console.log("Logg inn i vinduet hvis det ber om det (venter opptil 5 min)…");
await page.waitForFunction(() => !location.pathname.includes("/login"), {
  timeout: 300_000,
  polling: 1000,
});
if (!page.url().includes(`/events/${eventId}`)) {
  await page.goto(`${base}/admin/collections/events/${eventId}`, {
    waitUntil: "domcontentloaded",
  });
}

try {
  await page.waitForFunction(
    () => {
      const btn = [
        ...document.querySelectorAll<HTMLElement>(
          "button, [role='tab'], .tabs-field__tab-button"
        ),
      ].find(
        (b) => b.textContent?.includes("Påmeldte") && b.offsetParent !== null
      );
      btn?.click();
      return Boolean(btn);
    },
    { timeout: 30_000, polling: 1000 }
  );
} catch (err) {
  await page.screenshot({ path: join(outDir, "feil.png") });
  const info = await page.evaluate(() => ({
    url: location.href,
    tabs: [
      ...document.querySelectorAll<HTMLElement>("[class*='tab'], [role='tab']"),
    ]
      .slice(0, 30)
      .map(
        (el) =>
          `${el.tagName}.${el.className} «${el.textContent?.trim().slice(0, 40)}»`
      ),
  }));
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
  throw err;
}
try {
  await page.waitForSelector("::-p-text(Plasser tatt)", { timeout: 30_000 });
  await page.waitForSelector("table tbody tr", { timeout: 30_000 });
} catch (err) {
  await page.screenshot({ path: join(outDir, "feil.png") });
  await browser.close();
  throw err;
}
await new Promise((r) => setTimeout(r, 1500));

for (const [name, width] of [
  ["desktop", 1440],
  ["nettbrett", 820],
  ["mobil", 400],
] as const) {
  await page.setViewport({ width, height: 900 });
  await new Promise((r) => setTimeout(r, 1200));
  const panel = await page.$("::-p-text(Plasser tatt)");
  await panel?.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -120));
  await new Promise((r) => setTimeout(r, 400));
  const file = join(outDir, `pameldte-${name}.png`);
  await page.screenshot({ path: file });
  console.log(`✓ ${file}`);
}

await browser.close();
