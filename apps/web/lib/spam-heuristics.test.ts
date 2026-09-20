import { describe, expect, test } from "bun:test";
import { isHoneypotFilled, looksLikeGibberish } from "./spam-heuristics";

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
