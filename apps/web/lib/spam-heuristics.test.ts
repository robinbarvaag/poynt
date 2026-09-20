import { describe, expect, test } from "bun:test";
import {
  describeSubmission,
  isHoneypotFilled,
  looksLikeGibberish,
} from "./spam-heuristics";

describe("looksLikeGibberish", () => {
  // Ekte innsendinger fra spamboten 20.09.2026 — alle kom gjennom reCAPTCHA
  // med gyldig token, så det er disse sjekken faktisk må ta.
  const ekteSpam = [
    "TsPGxDXqnGBjjEtgnZ",
    "PJxocGeHOsZAuSuNd",
    "SZUKwVGNHkVophNIX",
    "LhyDzwlhYdqfTwftNsMUYJ",
    "UAFbOHFxhGFMvFwgVwfRx",
  ];

  for (const navn of ekteSpam) {
    test(`tar «${navn}»`, () => {
      expect(looksLikeGibberish(navn)).toBe(true);
    });
  }

  // Falske positive er verre enn å slippe gjennom litt spam: da mister vi
  // ekte henvendelser uten å vite det.
  const ekteNavn = [
    "Robin Barvåg",
    "Susanne Bjerga Todnem",
    "MARIT HANSEN",
    "marit hansen",
    "Ole-Martin Bø",
    "van der Berg",
    "McDonald",
    "Jan Kåre O'Brien",
    "Åse",
    "Arbeidsmiljøutvalget i Stavanger kommune",
    "Per",
    "",
  ];

  for (const navn of ekteNavn) {
    test(`slipper «${navn}» gjennom`, () => {
      expect(looksLikeGibberish(navn)).toBe(false);
    });
  }

  test("reagerer ikke på korte ord med kasusskifter", () => {
    expect(looksLikeGibberish("iPhone")).toBe(false);
    expect(looksLikeGibberish("aBcDeF")).toBe(false);
  });
});

describe("isHoneypotFilled", () => {
  test("tomt felt er et menneske", () => {
    expect(isHoneypotFilled("")).toBe(false);
    expect(isHoneypotFilled("   ")).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
    expect(isHoneypotFilled(null)).toBe(false);
  });

  test("utfylt felt er en robot", () => {
    expect(isHoneypotFilled("https://spam.example")).toBe(true);
  });
});

describe("describeSubmission", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 70.41.3.18",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120",
    referer: "https://www.poynt.no/kontakt",
  });

  test("tar med feltene som ble sendt inn", () => {
    const linje = describeSubmission({ navn: "Ola", epost: "ola@example.no" });
    expect(linje).toContain('navn="Ola"');
    expect(linje).toContain('epost="ola@example.no"');
  });

  test("hopper over felt uten verdi", () => {
    expect(describeSubmission({ navn: "Ola", sti: undefined })).toBe(
      'navn="Ola"'
    );
  });

  test("kutter lange verdier og slår sammen linjeskift", () => {
    const linje = describeSubmission({ melding: `a\n\n${"b".repeat(200)}` });
    expect(linje.length).toBeLessThan(160);
    expect(linje).toContain("…");
    expect(linje).not.toContain("\n");
  });

  test("tar med første IP, referer og user-agent når headere finnes", () => {
    const linje = describeSubmission({ navn: "Ola" }, headers);
    expect(linje).toContain("ip=203.0.113.10");
    expect(linje).not.toContain("70.41.3.18");
    expect(linje).toContain('referer="https://www.poynt.no/kontakt"');
    expect(linje).toContain("HeadlessChrome");
  });
});
