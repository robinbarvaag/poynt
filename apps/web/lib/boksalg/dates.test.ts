import { describe, expect, test } from "bun:test";
import { dayKey, daysFromToday, eachDay } from "./dates";

describe("dayKey", () => {
  test("regner dagen i norsk tid, ikke UTC", () => {
    // 23:30 UTC 14. oktober er 01:30 norsk sommertid 15. oktober.
    expect(dayKey("2026-10-14T23:30:00.000Z")).toBe("2026-10-15");
    // Vintertid: 23:30 UTC 1. desember er 00:30 norsk tid 2. desember.
    expect(dayKey("2026-12-01T23:30:00.000Z")).toBe("2026-12-02");
    expect(dayKey("2026-10-15T06:00:00.000Z")).toBe("2026-10-15");
  });

  test("tar både streng og Date, og tåler ugyldig", () => {
    expect(dayKey(new Date("2026-10-15T12:00:00Z"))).toBe("2026-10-15");
    expect(dayKey("tull")).toBe("");
  });
});

describe("daysFromToday", () => {
  test("hele dager fram og tilbake fra «i dag» i norsk tid", () => {
    const now = new Date("2026-10-15T10:00:00.000Z");
    expect(daysFromToday("2026-10-18", now)).toBe(3);
    expect(daysFromToday("2026-10-15", now)).toBe(0);
    expect(daysFromToday("2026-10-13", now)).toBe(-2);
  });

  test("er upåvirket av klokkeslett rundt midnatt", () => {
    // 23:30 UTC 14. oktober = 15. oktober i Norge → 3 dager til den 18.
    const now = new Date("2026-10-14T23:30:00.000Z");
    expect(daysFromToday("2026-10-18", now)).toBe(3);
  });
});

describe("eachDay", () => {
  test("gir hver dag fra og med start til og med slutt", () => {
    expect(eachDay("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(eachDay("2026-10-15", "2026-10-15")).toEqual(["2026-10-15"]);
  });

  test("tom når slutt er før start eller en dato er ugyldig", () => {
    expect(eachDay("2026-10-16", "2026-10-15")).toEqual([]);
    expect(eachDay("", "2026-10-15")).toEqual([]);
  });
});
