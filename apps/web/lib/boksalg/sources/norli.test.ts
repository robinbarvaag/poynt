import { describe, expect, test } from "bun:test";
import {
  type NorliRegion,
  normalizeQty,
  parsePickupStores,
  summarizeStores,
  toStoreStock,
} from "./norli";

/**
 * Norli-adapteren teller bare riktig hvis den tåler det Magento faktisk
 * sender: ID-er som strenger, beholdning som strenger/desimaler/null/negativt,
 * og samme butikk i flere regiongrupper. Hver av disse ville gitt feil tall
 * uten å feile — derfor tester vi dem, ikke bare «happy path».
 */

const store = (
  id: number | string,
  name: string,
  products: { id: number | string; qty_in_store: number | string | null }[],
  extra: Partial<
    NorliRegion["stores"] extends (infer S)[] | null | undefined ? S : never
  > = {}
) => ({ stockist_id: id, name, products, ...extra });

describe("normalizeQty", () => {
  test("tall, strenger og desimaler blir heltall", () => {
    expect(normalizeQty(3)).toBe(3);
    expect(normalizeQty("3")).toBe(3);
    expect(normalizeQty("3.0000")).toBe(3);
    expect(normalizeQty(2.7)).toBe(2);
  });

  test("null, tomt og tull blir 0", () => {
    expect(normalizeQty(null)).toBe(0);
    expect(normalizeQty(undefined)).toBe(0);
    expect(normalizeQty("")).toBe(0);
    expect(normalizeQty("abc")).toBe(0);
    expect(normalizeQty(Number.NaN)).toBe(0);
  });

  test("negativ beholdning (restordre) er ikke bøker på hylla", () => {
    expect(normalizeQty(-2)).toBe(0);
    expect(normalizeQty("-1")).toBe(0);
  });
});

describe("toStoreStock", () => {
  test("matcher produkt-ID på tvers av Int og String", () => {
    const row = toStoreStock(
      store(12, "Norli Bergen", [{ id: "4711", qty_in_store: "5" }]),
      "Vestland",
      4711
    );
    expect(row.qty).toBe(5);
    expect(row.storeId).toBe("12");
    expect(row.name).toBe("Bergen");
    expect(row.region).toBe("Vestland");
  });

  test("butikk uten produktet har 0, ikke udefinert", () => {
    const row = toStoreStock(
      store(12, "Norli Bergen", [{ id: 999, qty_in_store: 8 }]),
      "Vestland",
      4711
    );
    expect(row.qty).toBe(0);
  });

  test("tåler products: null og manglende region", () => {
    const row = toStoreStock(
      { stockist_id: "7", name: "Norli Tromsø", products: null, region: "" },
      "Troms",
      4711
    );
    expect(row.qty).toBe(0);
    expect(row.region).toBe("Troms");
  });

  test("trimmer e-post og normaliserer åpningstider", () => {
    const row = toStoreStock(
      store(1, "Norli Universitetsgata", [], {
        email: " akademisk.uib@norli.no",
        schedule: "Man–fre 09–18\r\nLør 10–16",
        latitude: "59.91",
        longitude: "10.74",
      }),
      "Oslo",
      null
    );
    expect(row.email).toBe("akademisk.uib@norli.no");
    expect(row.schedule).toBe("Man–fre 09–18\nLør 10–16");
    expect(row.latitude).toBe(59.91);
    expect(row.longitude).toBe(10.74);
  });
});

describe("parsePickupStores", () => {
  test("flater regiongrupper ut og summerer riktig", () => {
    const regions: NorliRegion[] = [
      {
        name: "Oslo",
        stores: [
          store(1, "Norli A", [{ id: 4711, qty_in_store: 3 }]),
          store(2, "Norli B", [{ id: 4711, qty_in_store: 0 }]),
        ],
      },
      {
        name: "Vestland",
        stores: [store(3, "Norli C", [{ id: 4711, qty_in_store: "2" }])],
      },
    ];
    const stores = parsePickupStores(regions, 4711);
    expect(stores.map((s) => s.storeId)).toEqual(["1", "2", "3"]);
    expect(summarizeStores(stores)).toEqual({
      storesWithStock: 2,
      totalCopies: 5,
    });
  });

  test("samme butikk i to grupper telles én gang, med høyeste beholdning", () => {
    const regions: NorliRegion[] = [
      {
        name: "Oslo",
        stores: [store(1, "Norli A", [{ id: 4711, qty_in_store: 3 }])],
      },
      {
        name: "Alle butikker",
        stores: [
          store(1, "Norli A", [{ id: 4711, qty_in_store: 0 }]),
          store("1", "Norli A", [{ id: 4711, qty_in_store: 4 }]),
        ],
      },
    ];
    const stores = parsePickupStores(regions, 4711);
    expect(stores).toHaveLength(1);
    expect(stores[0]?.qty).toBe(4);
    expect(summarizeStores(stores).totalCopies).toBe(4);
  });

  test("tåler null-lister og rader uten ID", () => {
    expect(parsePickupStores(null, 1)).toEqual([]);
    expect(parsePickupStores([{ name: "Oslo", stores: null }], 1)).toEqual([]);
    const stores = parsePickupStores(
      [
        {
          name: "Oslo",
          stores: [
            // biome-ignore lint/suspicious/noExplicitAny: bevisst ødelagt rad
            { name: "Uten ID", products: [] } as any,
            store(5, "Norli E", []),
          ],
        },
      ],
      1
    );
    expect(stores.map((s) => s.storeId)).toEqual(["5"]);
  });
});
