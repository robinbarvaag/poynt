import { describe, expect, test } from "bun:test";
import { countSales, diffSnapshots } from "./diff";
import type { SourceSnapshot, StoreStock } from "./types";

function snapshot(
  stores: StoreStock[],
  online: SourceSnapshot["online"] = "in_stock"
): SourceSnapshot {
  const withStock = stores.filter((s) => s.qty > 0);
  return {
    sourceKey: "norli",
    fetchedAt: "2026-10-16T06:00:00.000Z",
    online,
    externalId: "1572660",
    price: 399,
    stores,
    storesWithStock: withStock.length,
    totalCopies: withStock.reduce((sum, s) => sum + s.qty, 0),
  };
}

const oslo = (qty: number): StoreStock => ({
  storeId: "133",
  name: "Norli Universitetsgata, Oslo",
  city: "Oslo",
  region: "Oslo",
  qty,
});
const bergen = (qty: number): StoreStock => ({
  storeId: "46",
  name: "Norli Galleriet, Bergen",
  city: "Bergen",
  region: "Vestland",
  qty,
});

describe("diffSnapshots", () => {
  test("første snapshot gir ingen salgshendelser — det er en nullstilling", () => {
    expect(diffSnapshots(null, snapshot([oslo(4), bergen(2)]))).toEqual([]);
  });

  test("nedgang er salg", () => {
    const events = diffSnapshots(snapshot([oslo(4)]), snapshot([oslo(1)]));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("sale");
    expect(events[0]?.delta).toBe(3);
    expect(events[0]?.storeName).toBe("Norli Universitetsgata, Oslo");
  });

  test("ned til null markeres som utsolgt, men teller som salg", () => {
    const events = diffSnapshots(snapshot([oslo(2)]), snapshot([oslo(0)]));
    expect(events[0]?.type).toBe("sale");
    expect(events[0]?.delta).toBe(2);
    expect(events[0]?.note).toBe("Utsolgt i butikken");
    expect(countSales(events)).toBe(2);
  });

  test("oppgang er påfyll, ikke negativt salg", () => {
    const events = diffSnapshots(snapshot([oslo(2)]), snapshot([oslo(12)]));
    expect(events[0]?.type).toBe("restock");
    expect(events[0]?.delta).toBe(10);
    expect(countSales(events)).toBe(0);
  });

  test("påfyll i én butikk skjuler ikke salg i en annen", () => {
    const events = diffSnapshots(
      snapshot([oslo(5), bergen(3)]),
      snapshot([oslo(20), bergen(1)])
    );
    expect(countSales(events)).toBe(2);
    expect(events.map((e) => e.type).sort()).toEqual(["restock", "sale"]);
  });

  test("ny butikk på lista er «listed», ikke påfyll", () => {
    const events = diffSnapshots(
      snapshot([oslo(4)]),
      snapshot([oslo(4), bergen(6)])
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("listed");
    expect(events[0]?.delta).toBe(6);
    expect(countSales(events)).toBe(0);
  });

  test("butikk som forsvinner telles ikke som salg — vi vet ikke nok", () => {
    const events = diffSnapshots(
      snapshot([oslo(4), bergen(3)]),
      snapshot([oslo(4)])
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("delisted");
    expect(countSales(events)).toBe(0);
  });

  test("uendret lager gir ingen hendelser — loggen skal være signal, ikke støy", () => {
    expect(
      diffSnapshots(
        snapshot([oslo(4), bergen(2)]),
        snapshot([oslo(4), bergen(2)])
      )
    ).toEqual([]);
  });

  test("forhåndssalg → i salg fanges som statusendring", () => {
    const events = diffSnapshots(
      snapshot([], "preorder"),
      snapshot([], "in_stock")
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("availability");
    expect(events[0]?.note).toBe("preorder → in_stock");
  });

  test("utrullingsdagen: status snur og boka lander i butikkene", () => {
    const events = diffSnapshots(
      snapshot([], "preorder"),
      snapshot([oslo(8), bergen(5)], "in_stock")
    );
    expect(events.filter((e) => e.type === "listed")).toHaveLength(2);
    expect(events.filter((e) => e.type === "availability")).toHaveLength(1);
    expect(countSales(events)).toBe(0);
  });
});
