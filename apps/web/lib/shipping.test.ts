import { describe, expect, test } from "bun:test";
import {
  cartNeedsShipping,
  normalizePhone,
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
  phone: "+47 999 99 999",
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

describe("normalizePhone", () => {
  test("godtar norske nummer med og uten landkode", () => {
    expect(normalizePhone("99999999")).toBe("99999999");
    expect(normalizePhone("+47 999 99 999")).toBe("99999999");
    expect(normalizePhone("0047 99999999")).toBe("99999999");
  });

  test("avviser for korte, for lange og utenlandske nummer", () => {
    expect(normalizePhone("9999999")).toBeNull();
    expect(normalizePhone("+46 70 123 45 67")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
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
        phone: "99999999",
      },
    });
  });

  test("gir feil per felt som mangler", () => {
    const result = validateShippingInput({
      ...valid,
      name: "",
      postalCode: "15",
      phone: "",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      "name",
      "phone",
      "postalCode",
    ]);
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
  test("gjenskaper adressen fra ordren", () => {
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
  });

  test("gir null når ordren ikke har adresse", () => {
    expect(shippingFromStored({ name: "Ola" })).toBeNull();
    expect(shippingFromStored(undefined)).toBeNull();
  });
});
