import { describe, expect, test } from "bun:test";
import { BROADCAST_NAME_MAX, broadcastName } from "@poynt/email/broadcast-name";

const long =
  "Slik får du flere kunder i desember uten å jobbe deg i hjel før jul – fem grep som virker";

describe("broadcastName", () => {
  test("korte emner står urørt", () => {
    expect(broadcastName("Julehilsen fra Poynt")).toBe("Julehilsen fra Poynt");
    expect(broadcastName("Julehilsen", { prefix: "[TEST] " })).toBe(
      "[TEST] Julehilsen"
    );
  });

  test("akkurat 70 tegn kortes ikke", () => {
    const exact = "a".repeat(BROADCAST_NAME_MAX);
    expect(broadcastName(exact)).toBe(exact);
  });

  test("lange emner kortes til maks 70 tegn med «…»", () => {
    const name = broadcastName(long);
    expect(long.length).toBeGreaterThan(BROADCAST_NAME_MAX);
    expect(name.length).toBeLessThanOrEqual(BROADCAST_NAME_MAX);
    expect(name.endsWith("…")).toBe(true);
    expect(long.startsWith(name.slice(0, -1))).toBe(true);
  });

  test("prefiks og suffiks beholdes — emnet forkortes", () => {
    const test = broadcastName(long, { prefix: "[TEST] " });
    expect(test.length).toBeLessThanOrEqual(BROADCAST_NAME_MAX);
    expect(test.startsWith("[TEST] Slik får du")).toBe(true);

    const segment = broadcastName(long, { suffix: " (Ettersending)" });
    expect(segment.length).toBeLessThanOrEqual(BROADCAST_NAME_MAX);
    expect(segment.endsWith("… (Ettersending)")).toBe(true);
  });

  test("urimelig langt segmentnavn holder seg likevel innenfor", () => {
    const name = broadcastName(long, { suffix: ` (${"x".repeat(80)})` });
    expect(name.length).toBeLessThanOrEqual(BROADCAST_NAME_MAX);
  });

  test("deler ikke en emoji i to", () => {
    const name = broadcastName(`${"a".repeat(68)}🎉🎉🎉`);
    expect(name.length).toBeLessThanOrEqual(BROADCAST_NAME_MAX);
    expect(name).toBe(`${"a".repeat(68)}…`);
  });
});
