import { describe, expect, test } from "bun:test";
import {
  eventPriceKr,
  holdExpiresAt,
  isEventVippsReference,
  partyAmountKr,
  paymentMethodsFor,
  stripeSessionExpiry,
  vippsEventReference,
} from "./payment-rules";

describe("betalte eventer", () => {
  test("gratis når pris mangler, er 0 eller påmeldingen skjer et annet sted", () => {
    expect(eventPriceKr({ priceKr: null })).toBeNull();
    expect(eventPriceKr({ priceKr: 0 })).toBeNull();
    expect(
      eventPriceKr({ priceKr: 300, registrationMode: "external" })
    ).toBeNull();
    expect(eventPriceKr({ priceKr: 300 })).toBe(300);
  });

  test("betalingsmåter: begge som standard, ukjente filtreres bort", () => {
    expect(paymentMethodsFor({})).toEqual(["vipps", "stripe"]);
    expect(paymentMethodsFor({ paymentMethods: ["vipps"] })).toEqual(["vipps"]);
    expect(paymentMethodsFor({ paymentMethods: ["bitcoin"] })).toEqual([
      "vipps",
      "stripe",
    ]);
  });

  test("beløp for hele følget", () => {
    expect(partyAmountKr(300, 3)).toBe(900);
    expect(partyAmountKr(99.5, 2)).toBe(199);
    expect(partyAmountKr(250, 0)).toBe(250);
  });

  test("plassen holdes 30 min i kassen og 24 t ved opprykk", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    expect(holdExpiresAt("checkout", now).toISOString()).toBe(
      "2026-10-01T12:30:00.000Z"
    );
    expect(holdExpiresAt("promotion", now).toISOString()).toBe(
      "2026-10-02T12:00:00.000Z"
    );
  });

  test("Stripe-utløp klemmes mellom 31 min og nesten 24 t", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    const seconds = (iso: string) => new Date(iso).getTime() / 1000;
    expect(stripeSessionExpiry(new Date("2026-10-01T12:30:00Z"), now)).toBe(
      seconds("2026-10-01T12:31:00Z")
    );
    expect(stripeSessionExpiry(new Date("2026-10-05T12:00:00Z"), now)).toBe(
      seconds("2026-10-02T11:55:00Z")
    );
  });

  test("Vipps-referanse er gyldig og gjenkjennes", () => {
    const reference = vippsEventReference(42, "ab12cd34");
    expect(reference).toBe("poynt-event-42-ab12cd34");
    expect(reference).toMatch(/^[a-zA-Z0-9-]{8,64}$/);
    expect(isEventVippsReference(reference)).toBe(true);
    expect(isEventVippsReference("poynt-10042-ab12cd34")).toBe(false);
  });
});
