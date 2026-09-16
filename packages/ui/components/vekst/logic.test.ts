import { describe, expect, test } from "bun:test";
import {
  billableHours,
  countYes,
  formatInput,
  formatKr,
  hourlyRate,
  isoWeekKey,
  monthStatus,
  parseNumber,
  profitPercent,
  profitVerdict,
  profitZone,
  strongestIndex,
  weakestIndex,
  zoneForYes,
} from "./logic";

describe("lønnsomhet", () => {
  test("Gudruns komler taper penger", () => {
    const percent = profitPercent(140, 160);
    expect(percent).toBeCloseTo(-14.29, 1);
    expect(profitVerdict(percent as number)).toBe("tap");
    expect(profitZone("tap")).toBe("rosa");
  });

  test("grensene følger boka (30–60 % er bra)", () => {
    expect(profitVerdict(0)).toBe("tynt");
    expect(profitVerdict(29.9)).toBe("tynt");
    expect(profitVerdict(30)).toBe("bra");
    expect(profitVerdict(60)).toBe("bra");
    expect(profitVerdict(60.1)).toBe("hoy");
    expect(profitZone("hoy")).toBe("gronn");
  });

  test("ingen prosent uten pris", () => {
    expect(profitPercent(0, 100)).toBeNull();
    expect(profitPercent(Number.NaN, 100)).toBeNull();
  });
});

describe("timepris", () => {
  const base = {
    annualSalary: 600_000,
    multiplier: 1.5,
    otherCosts: 60_000,
    workWeeks: 46,
    hoursPerWeek: 37.5,
    billableShare: 60,
  };

  test("lønn × påslag + kostnader, delt på fakturerbare timer", () => {
    expect(billableHours(base)).toBeCloseTo(1035);
    expect(hourlyRate(base)).toBeCloseTo(960_000 / 1035);
  });

  test("ingen fakturerbare timer gir ingen timepris", () => {
    expect(hourlyRate({ ...base, billableShare: 0 })).toBeNull();
    expect(hourlyRate({ ...base, workWeeks: -3 })).toBeNull();
  });

  test("andel over 100 % kappes", () => {
    expect(billableHours({ ...base, billableShare: 140 })).toBeCloseTo(1725);
  });
});

describe("ja/nei-sjekker", () => {
  test("bokas soner for tre spørsmål", () => {
    expect(zoneForYes(0, 3)).toBe("rosa");
    expect(zoneForYes(1, 3)).toBe("rosa");
    expect(zoneForYes(2, 3)).toBe("gul");
    expect(zoneForYes(3, 3)).toBe("gronn");
    expect(zoneForYes(0, 0)).toBe("rosa");
  });

  test("svakeste og sterkeste tar første ved likt", () => {
    const scores = [
      { yes: 2, total: 3 },
      { yes: 1, total: 3 },
      { yes: 3, total: 3 },
      { yes: 1, total: 3 },
    ];
    expect(weakestIndex(scores)).toBe(1);
    expect(strongestIndex(scores)).toBe(2);
    expect(weakestIndex([])).toBe(-1);
  });

  test("teller bare ja", () => {
    expect(countYes([true, null, false, true])).toBe(2);
  });
});

describe("spåkula", () => {
  test("status per måned mot nullpunktet", () => {
    expect(monthStatus({ sure: 0, likely: 0 }, 127_000)).toBe("tomt");
    expect(monthStatus({ sure: 152_000, likely: 0 }, 127_000)).toBe("dekket");
    expect(monthStatus({ sure: 98_000, likely: 40_000 }, 127_000)).toBe(
      "kanskje"
    );
    expect(monthStatus({ sure: 40_000, likely: 0 }, 127_000)).toBe("under");
  });
});

describe("diverse", () => {
  test("ISO-uke", () => {
    expect(isoWeekKey(new Date(2026, 8, 15))).toBe("2026-W38");
    expect(isoWeekKey(new Date(2027, 0, 1))).toBe("2026-W53");
  });

  test("norske tall", () => {
    expect(parseNumber("1 250,5")).toBe(1250.5);
    expect(parseNumber("abc")).toBe(0);
    expect(formatKr(1250).replace(/\s/g, " ")).toBe("1 250 kr");
  });

  test("pynter på tallfelt uten å slette noe", () => {
    const plain = (raw: string) => formatInput(raw).replace(/\s/g, " ");
    expect(plain("40000")).toBe("40 000");
    expect(plain("152 00")).toBe("15 200");
    expect(plain("37.5")).toBe("37,5");
    expect(plain("37,5")).toBe("37,5");
    expect(formatInput("  ")).toBe("");
    expect(formatInput("ca 40")).toBe("ca 40");
    expect(formatInput("-5")).toBe("-5");
    expect(parseNumber(formatInput("1250,75"))).toBe(1250.75);
  });
});
