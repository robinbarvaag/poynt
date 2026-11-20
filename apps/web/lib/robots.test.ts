import { describe, expect, test } from "bun:test";
import { resolveRobots } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";
import { CONTENT_SIGNAL, buildRobots } from "./robots";

const SITE = "https://www.poynt.no";

/** Teksten slik Next skriver den ut på `/robots.txt`. */
const text = resolveRobots(buildRobots(SITE));
const lines = text.split("\n");

function values(directive: string): string[] {
  const prefix = `${directive}: `;
  return lines
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length));
}

/**
 * Robots-standarden (RFC 9309): den lengste regelen som matcher stien
 * vinner, og Allow vinner ved lik lengde.
 */
function isAllowed(path: string): boolean {
  let best = { length: -1, allowed: true };
  for (const [allowed, rules] of [
    [true, values("Allow")],
    [false, values("Disallow")],
  ] as const) {
    for (const rule of rules) {
      if (!path.startsWith(rule)) continue;
      if (
        rule.length > best.length ||
        (rule.length === best.length && allowed)
      ) {
        best = { length: rule.length, allowed };
      }
    }
  }
  return best.allowed;
}

describe("robots.txt", () => {
  test("hele fila, linje for linje", () => {
    expect(text).toBe(
      [
        "User-Agent: *",
        "Allow: /",
        "Allow: /api/og-image",
        "Allow: /api/media/file/",
        "Disallow: /admin",
        "Disallow: /api",
        "Disallow: /on-poynt/",
        "Disallow: /forhandsvisning",
        "Disallow: /eventer/billett/",
        "Disallow: /innsjekk",
        "Disallow: /intern",
        `Content-Signal: ${CONTENT_SIGNAL}`,
        "",
        `Host: ${SITE}`,
        `Sitemap: ${SITE}/sitemap.xml`,
        "",
      ].join("\n")
    );
  });

  test("Content-Signal står i *-gruppa, før Host og Sitemap", () => {
    expect(values("Content-Signal")).toEqual([
      "search=yes, ai-input=yes, ai-train=yes",
    ]);
    const signal = lines.findIndex((line) => line.startsWith("Content-Signal"));
    expect(signal).toBeGreaterThan(lines.indexOf("User-Agent: *"));
    expect(signal).toBeLessThan(lines.indexOf(""));
  });

  test("logo og delingsbilde kan hentes, resten av /api er stengt", () => {
    expect(isAllowed("/api/og-image?title=Poynt")).toBe(true);
    expect(isAllowed("/api/media/file/logo.png")).toBe(true);
    expect(isAllowed("/api/media")).toBe(false);
    expect(isAllowed("/api/checkout")).toBe(false);
    expect(isAllowed("/api/md/blogg")).toBe(false);
  });

  test("sperrene fra før gjelder fortsatt", () => {
    for (const path of [
      "/admin",
      "/on-poynt/kurs",
      "/forhandsvisning",
      "/eventer/billett/abc",
      "/innsjekk",
      "/intern/boksalg",
    ]) {
      expect(isAllowed(path)).toBe(false);
    }
    expect(isAllowed("/")).toBe(true);
    expect(isAllowed("/on-poynt")).toBe(true);
    expect(isAllowed("/blogg/et-innlegg")).toBe(true);
  });

  test("staging/preview stenger alt", () => {
    expect(
      buildRobots("https://staging.poynt.no", { indexable: false })
    ).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });
});
