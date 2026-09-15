import { describe, expect, test } from "bun:test";
import {
  buildWeeklyIcs,
  endTime,
  foldLine,
  icsFileName,
  nextWeekdayDate,
  parseWeeklyEventParams,
  weeklyEventHref,
} from "./ics";

const event = {
  title: "Omsetnings-onsdag",
  description: "Halve dagen salg, halve markedsføring; minst én aktivitet.",
  weekday: "WE" as const,
  startTime: "09:00",
  durationMinutes: 240,
};

describe("kalenderfil", () => {
  test("neste onsdag i Oslo, fra og med i dag", () => {
    // Tirsdag 15. september 2026, kl. 12 UTC.
    expect(nextWeekdayDate(new Date("2026-09-15T12:00:00Z"), "WE")).toBe(
      "20260916"
    );
    // Onsdag = i dag.
    expect(nextWeekdayDate(new Date("2026-09-16T08:00:00Z"), "WE")).toBe(
      "20260916"
    );
    // 23:30 UTC tirsdag er allerede onsdag i Oslo.
    expect(nextWeekdayDate(new Date("2026-09-15T23:30:00Z"), "TU")).toBe(
      "20260922"
    );
  });

  test("sluttid", () => {
    expect(endTime("09:00", 240)).toBe("13:00");
    expect(endTime("23:30", 60)).toBe("00:30");
  });

  test("bygger en gyldig, ukentlig avtale", () => {
    const ics = buildWeeklyIcs(event, new Date("2026-09-15T12:00:00Z"));
    expect(ics).toContain("DTSTART;TZID=Europe/Oslo:20260916T090000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=WE");
    expect(ics).toContain("DURATION:PT240M");
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("\\; minst");
    expect(ics.endsWith("\r\n")).toBe(true);
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  test("bretter lange linjer med æøå uten å dele tegn", () => {
    const folded = foldLine(`SUMMARY:${"æ".repeat(60)}`);
    const parts = folded.split("\r\n ");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join("")).toBe(`SUMMARY:${"æ".repeat(60)}`);
  });

  test("lenke og tolking går begge veier", () => {
    const href = weeklyEventHref(event);
    const params = new URL(href, "https://poynt.no").searchParams;
    expect(parseWeeklyEventParams(params)).toEqual(event);
    expect(icsFileName(event)).toBe("omsetnings-onsdag.ics");
  });

  test("avviser ugyldige verdier", () => {
    const bad = (overrides: Record<string, string>) =>
      parseWeeklyEventParams(
        new URLSearchParams({
          title: "X",
          day: "WE",
          start: "09:00",
          duration: "60",
          ...overrides,
        })
      );
    expect(bad({})).not.toBeNull();
    expect(bad({ day: "XX" })).toBeNull();
    expect(bad({ start: "25:00" })).toBeNull();
    expect(bad({ duration: "5" })).toBeNull();
    expect(bad({ title: " " })).toBeNull();
  });
});
