import { describe, expect, test } from "bun:test";
import {
  type ArkStore,
  parseStores,
  toAvailability,
  toPrice,
  toSchedule,
  toStoreStock,
} from "./ark";
import { retryAfterMs } from "./http";

const ISBN = "9788230375334";

/** Slik ARK svarte 20.10.2026, nedkortet. */
const akerBrygge: ArkStore = {
  id: "3100",
  name: "ARK Aker Brygge",
  address: {
    streetName: "Holmens gate 8",
    streetNumber: "",
    city: "Oslo",
    zipcode: "0250",
    municipality: "Oslo",
  },
  latitude: "59.9100975",
  longitude: "10.7257317",
  mondayOpeningHours: {
    isOpen: true,
    openFrom: "10:00:00",
    openTo: "20:00:00",
  },
  tuesdayOpeningHours: {
    isOpen: true,
    openFrom: "10:00:00",
    openTo: "20:00:00",
  },
  saturdayOpeningHours: {
    isOpen: true,
    openFrom: "10:00:00",
    openTo: "18:00:00",
  },
  sundayOpeningHours: {
    isOpen: false,
    openFrom: "00:00:00",
    openTo: "00:00:00",
  },
  phoneNumber: "96 91 85 84",
  email: "aker.brygge@ark.no",
  productAvailability: {
    [ISBN]: {
      isCnCAvailable: true,
      isCncOrderAvailable: true,
      availableQuantityInStore: 2,
    },
  },
};

describe("toStoreStock", () => {
  test("mapper ARKs butikk til vår rad, uten «ARK »-prefiks og med fylke", () => {
    expect(toStoreStock(akerBrygge, ISBN)).toEqual({
      storeId: "3100",
      name: "Aker Brygge",
      city: "Oslo",
      region: "Oslo",
      qty: 2,
      address: "Holmens gate 8",
      postcode: "0250",
      email: "aker.brygge@ark.no",
      phone: "96 91 85 84",
      schedule:
        "Mandag 10:00–20:00\nTirsdag 10:00–20:00\nLørdag 10:00–18:00\nSøndag stengt",
      latitude: 59.9100975,
      longitude: 10.7257317,
    });
  });

  test("beholdning for en annen ISBN, null og negativt teller som 0", () => {
    const other = {
      ...akerBrygge,
      productAvailability: { "999": { availableQuantityInStore: 5 } },
    };
    expect(toStoreStock(other, ISBN).qty).toBe(0);
    expect(
      toStoreStock(
        {
          ...akerBrygge,
          productAvailability: { [ISBN]: { availableQuantityInStore: null } },
        },
        ISBN
      ).qty
    ).toBe(0);
    expect(
      toStoreStock(
        {
          ...akerBrygge,
          productAvailability: { [ISBN]: { availableQuantityInStore: -1 } },
        },
        ISBN
      ).qty
    ).toBe(0);
    expect(
      toStoreStock(
        {
          ...akerBrygge,
          productAvailability: { [ISBN]: { availableQuantityInStore: "3" } },
        },
        ISBN
      ).qty
    ).toBe(3);
  });

  test("faller tilbake på kommunen når postnummeret mangler", () => {
    const store = {
      ...akerBrygge,
      address: { city: "Oslo", municipality: "Oslo", zipcode: null },
    };
    const row = toStoreStock(store, ISBN);
    expect(row.region).toBe("Oslo");
    expect(row.postcode).toBeUndefined();
    expect(row.address).toBeUndefined();
  });

  test("setter sammen gate og nummer", () => {
    const store = {
      ...akerBrygge,
      address: { streetName: "Torvet", streetNumber: "6", zipcode: "2000" },
    };
    const row = toStoreStock(store, ISBN);
    expect(row.address).toBe("Torvet 6");
    expect(row.region).toBe("Akershus");
  });
});

describe("toSchedule", () => {
  test("tom uten åpningstider", () => {
    expect(toSchedule({ id: 1, name: "ARK X" })).toBeUndefined();
  });
});

describe("parseStores", () => {
  test("dedupliserer på ID og beholder høyeste beholdning", () => {
    const twice = [
      akerBrygge,
      {
        ...akerBrygge,
        productAvailability: { [ISBN]: { availableQuantityInStore: 0 } },
      },
    ];
    const stores = parseStores(twice, ISBN);
    expect(stores).toHaveLength(1);
    expect(stores[0]?.qty).toBe(2);
  });

  test("hopper over rader uten ID eller navn, tåler null", () => {
    expect(parseStores(null, ISBN)).toEqual([]);
    expect(
      parseStores([{ id: null as unknown as string, name: "ARK X" }], ISBN)
    ).toEqual([]);
  });
});

describe("toAvailability", () => {
  test("forstår ARKs ord uavhengig av store og små bokstaver", () => {
    expect(toAvailability("Available")).toBe("in_stock");
    expect(toAvailability("inStock")).toBe("in_stock");
    expect(toAvailability("PreOrder")).toBe("preorder");
    expect(toAvailability("Unavailable")).toBe("out_of_stock");
    expect(toAvailability("SoldOut")).toBe("out_of_stock");
    expect(toAvailability(null)).toBe("unknown");
    expect(toAvailability("Something")).toBe("unknown");
  });
});

describe("toPrice", () => {
  test("øre → kroner, uten å gjøre 0 og null til en pris", () => {
    expect(toPrice(39900)).toBe(399);
    expect(toPrice(39950)).toBe(399.5);
    expect(toPrice(0)).toBeNull();
    expect(toPrice(null)).toBeNull();
    expect(toPrice(undefined)).toBeNull();
  });
});

describe("retryAfterMs", () => {
  test("sekunder", () => {
    expect(retryAfterMs("120")).toBe(120_000);
  });

  test("HTTP-dato i framtida", () => {
    const soon = new Date(Date.now() + 5_000).toUTCString();
    const value = retryAfterMs(soon);
    expect(value).not.toBeNull();
    expect(value ?? 0).toBeGreaterThan(3_000);
    expect(value ?? 0).toBeLessThanOrEqual(5_000);
  });

  test("manglende eller uleselig gir null", () => {
    expect(retryAfterMs(null)).toBeNull();
    expect(retryAfterMs("snart")).toBeNull();
  });
});
