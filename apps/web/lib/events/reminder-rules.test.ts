import { describe, expect, test } from "bun:test";
import { gotTicketRecently, reminderWindow } from "./reminder-rules";

describe("påminnelse før event", () => {
  const now = new Date("2026-10-14T18:00:00Z");

  test("vinduet er fra 2 til 24 timer fram i tid", () => {
    const { from, to } = reminderWindow(now);
    expect(from.toISOString()).toBe("2026-10-14T20:00:00.000Z");
    expect(to.toISOString()).toBe("2026-10-15T18:00:00.000Z");
  });

  test("påmeldt for lenge siden får påminnelse", () => {
    expect(gotTicketRecently({ createdAt: "2026-09-20T10:00:00Z" }, now)).toBe(
      false
    );
  });

  test("påmeldt de siste 12 timene hoppes over", () => {
    expect(gotTicketRecently({ createdAt: "2026-10-14T09:00:00Z" }, now)).toBe(
      true
    );
  });

  test("nylig opprykk eller betaling teller som ny billett", () => {
    const old = "2026-09-20T10:00:00Z";
    expect(
      gotTicketRecently(
        { createdAt: old, promotedAt: "2026-10-14T12:00:00Z" },
        now
      )
    ).toBe(true);
    expect(
      gotTicketRecently({ createdAt: old, paidAt: "2026-10-14T17:00:00Z" }, now)
    ).toBe(true);
    expect(
      gotTicketRecently({ createdAt: old, promotedAt: null, paidAt: null }, now)
    ).toBe(false);
  });
});
