import { describe, expect, test } from "bun:test";
import {
  cartNeedsShipping,
  shippingFromStored,
  shippingFromStripeMetadata,
  shippingToStripeMetadata,
  validateShippingInput,
} from "./shipping";

const valid = {
  name: "Kari Nordmann",
  line1: "Storgata 1",
  line2: "",
  postalCode: "0155",
  city: "Oslo",
};

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

describe("validateShippingInput", () => {
  test("normaliserer en gyldig adresse", () => {
    expect(validateShippingInput({ ...valid, line2: " Leil. 4 " })).toEqual({
      ok: true,
      address: {
        name: "Kari Nordmann",
        line1: "Storgata 1",
        line2: "Leil. 4",
        postalCode: "0155",
        city: "Oslo",
        country: "NO",
      },
    });
  });

  test("gir feil per felt som mangler", () => {
    const result = validateShippingInput({
      ...valid,
      name: "",
      postalCode: "15",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["name", "postalCode"]);
  });

  test("ignorerer telefon fra eldre klienter", () => {
    const result = validateShippingInput({
      ...valid,
      phone: "99999999",
    } as typeof valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect("phone" in result.address).toBe(false);
  });

  test("tåler null og rare typer", () => {
    expect(validateShippingInput(null).ok).toBe(false);
    expect(validateShippingInput({ name: 42 as unknown as string }).ok).toBe(
      false
    );
  });
});

describe("Stripe-metadata", () => {
  test("rundtur gjennom metadata beholder adressen", () => {
    const parsed = validateShippingInput(valid);
    if (!parsed.ok) throw new Error("ugyldig testdata");
    const meta = shippingToStripeMetadata(parsed.address);
    expect(meta.ship_line2).toBeUndefined();
    expect(shippingFromStripeMetadata(meta)).toEqual(parsed.address);
  });

  test("gir null uten adresse i metadata", () => {
    expect(shippingFromStripeMetadata({ cart: "[]" })).toBeNull();
    expect(shippingFromStripeMetadata(null)).toBeNull();
  });
});

describe("shippingFromStored", () => {
  test("gjenskaper adressen fra ordren, med telefon bare der den finnes", () => {
    expect(
      shippingFromStored({
        name: "Ola",
        line1: "Gata 1",
        line2: null,
        postalCode: "5003",
        city: "Bergen",
        country: "NO",
        phone: "91234567",
      })
    ).toEqual({
      name: "Ola",
      line1: "Gata 1",
      postalCode: "5003",
      city: "Bergen",
      country: "NO",
      phone: "91234567",
    });
    expect(
      shippingFromStored({
        name: "Ola",
        line1: "Gata 1",
        postalCode: "5003",
        city: "Bergen",
        phone: null,
      })
    ).not.toHaveProperty("phone");
  });

  test("gir null når ordren ikke har adresse", () => {
    expect(shippingFromStored({ name: "Ola" })).toBeNull();
    expect(shippingFromStored(undefined)).toBeNull();
  });
});
