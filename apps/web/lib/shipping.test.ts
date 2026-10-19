import { describe, expect, test } from "bun:test";
import type Stripe from "stripe";
import {
  cartNeedsShipping,
  shippingFromStripeSession,
  shippingFromVippsUserinfo,
} from "./shipping";

describe("cartNeedsShipping", () => {
  test("er sann når minst ett produkt krever frakt", () => {
    expect(
      cartNeedsShipping([
        { product: { requiresShipping: false } },
        { product: { requiresShipping: true } },
      ])
    ).toBe(true);
  });

  test("er usann for digitale kurver og manglende felt", () => {
    expect(
      cartNeedsShipping([
        { product: { requiresShipping: null } },
        { product: {} },
      ])
    ).toBe(false);
  });
});

describe("shippingFromStripeSession", () => {
  const base = {
    customer_details: { name: "Kari Nordmann", phone: "+4799999999" },
  };

  test("leser collected_information (API ≥ 2025-01-27)", () => {
    const session = {
      ...base,
      collected_information: {
        shipping_details: {
          name: "Kari N.",
          address: {
            line1: "Storgata 1",
            line2: "Leil. 4",
            postal_code: "0155",
            city: "Oslo",
            country: "no",
          },
        },
      },
    } as unknown as Stripe.Checkout.Session;

    expect(shippingFromStripeSession(session)).toEqual({
      name: "Kari N.",
      line1: "Storgata 1",
      line2: "Leil. 4",
      postalCode: "0155",
      city: "Oslo",
      country: "NO",
      phone: "+4799999999",
    });
  });

  test("faller tilbake på shipping_details og kundenavn", () => {
    const session = {
      ...base,
      shipping_details: {
        address: {
          line1: "Storgata 1",
          postal_code: "0155",
          city: "Oslo",
          country: "NO",
        },
      },
    } as unknown as Stripe.Checkout.Session;

    expect(shippingFromStripeSession(session)?.name).toBe("Kari Nordmann");
    expect(shippingFromStripeSession(session)?.line2).toBeUndefined();
  });

  test("gir null når adressen mangler eller er ufullstendig", () => {
    expect(
      shippingFromStripeSession(base as unknown as Stripe.Checkout.Session)
    ).toBeNull();
    expect(
      shippingFromStripeSession({
        collected_information: {
          shipping_details: { address: { line1: "Storgata 1", country: "NO" } },
        },
      } as unknown as Stripe.Checkout.Session)
    ).toBeNull();
  });
});

describe("shippingFromVippsUserinfo", () => {
  test("foretrekker hjemmeadressen og deler opp flerlinjet gate", () => {
    const result = shippingFromVippsUserinfo(
      {
        name: "Ola Nordmann",
        phone_number: "4791234567",
        address: {
          address_type: "work",
          country: "NO",
          postal_code: "5003",
          region: "Bergen",
          street_address: "Jobbveien 2",
        },
        other_addresses: [
          {
            address_type: "home",
            country: "NO",
            postal_code: "0155",
            region: "Oslo",
            street_address: "Storgata 1\nOppgang B",
          },
        ],
      },
      { name: "Ola N." }
    );

    expect(result).toEqual({
      name: "Ola N.",
      line1: "Storgata 1",
      line2: "Oppgang B",
      postalCode: "0155",
      city: "Oslo",
      country: "NO",
      phone: "4791234567",
    });
  });

  test("gir null uten adresse (kunden delte ikke)", () => {
    expect(shippingFromVippsUserinfo({ name: "Ola" })).toBeNull();
    expect(shippingFromVippsUserinfo(null)).toBeNull();
  });
});
