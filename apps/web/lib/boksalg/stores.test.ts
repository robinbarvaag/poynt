import { describe, expect, test } from "bun:test";
import { deriveStoreRow } from "./stores";
import type { StockEvent, StoreStock } from "./types";

const jekta: StoreStock = {
  storeId: "77",
  name: "Jekta",
  city: "Tromsø",
  region: "Troms",
  qty: 1,
  email: "jekta@norli.no",
  phone: "99110826",
  address: "Karlsøyvegen 12",
  postcode: "9015",
  schedule: "Man-Fre: 10-21\nLør: 10-18",
  latitude: 69.68,
  longitude: 18.93,
};

const sale = (storeId: string, delta: number): StockEvent => ({
  sourceKey: "norli",
  type: "sale",
  storeId,
  storeName: "x",
  city: null,
  region: null,
  from: null,
  to: null,
  delta,
  note: null,
});

const restock = (storeId: string, delta: number): StockEvent => ({
  ...sale(storeId, delta),
  type: "restock",
});

const NOW = "2026-10-16T06:00:00.000Z";

describe("deriveStoreRow", () => {
  test("ny butikk: kontaktinfo kopieres, tellere starter på null", () => {
    const row = deriveStoreRow("norli", { ...jekta, qty: 0 }, null, [], NOW);
    expect(row.email).toBe("jekta@norli.no");
    expect(row.schedule).toBe("Man-Fre: 10-21\nLør: 10-18");
    expect(row.currentQty).toBe(0);
    expect(row.maxQty).toBe(0);
    expect(row.soldEstimate).toBe(0);
    expect(row.firstStockedAt).toBeNull();
    expect(row.lastSeenAt).toBe(NOW);
  });

  test("første gang med eksemplarer setter «fikk boka»", () => {
    const row = deriveStoreRow("norli", { ...jekta, qty: 2 }, null, [], NOW);
    expect(row.firstStockedAt).toBe(NOW);
    expect(row.maxQty).toBe(2);
  });

  test("«fikk boka» beholdes fra før — den skal ikke flytte seg ved påfyll", () => {
    const earlier = "2026-10-15T06:00:00.000Z";
    const row = deriveStoreRow(
      "norli",
      { ...jekta, qty: 5 },
      {
        maxQty: 2,
        soldEstimate: 1,
        restockedEstimate: 0,
        firstStockedAt: earlier,
      },
      [restock("77", 4)],
      NOW
    );
    expect(row.firstStockedAt).toBe(earlier);
    expect(row.maxQty).toBe(5);
    expect(row.restockedEstimate).toBe(4);
  });

  test("solgt akkumuleres fra denne hentingens hendelser — bare denne butikkens", () => {
    const row = deriveStoreRow(
      "norli",
      { ...jekta, qty: 0 },
      { maxQty: 2, soldEstimate: 3, restockedEstimate: 0, firstStockedAt: NOW },
      [sale("77", 1), sale("999", 7), restock("999", 2)],
      NOW
    );
    expect(row.soldEstimate).toBe(4);
    expect(row.restockedEstimate).toBe(0);
    // Gått tom: 0 nå, men har hatt boka.
    expect(row.currentQty).toBe(0);
    expect(row.maxQty).toBe(2);
  });

  test("oppfølgingsfelt finnes ikke i det hentingen skriver", () => {
    const row = deriveStoreRow("norli", jekta, null, [], NOW);
    expect(row).not.toHaveProperty("followUpStatus");
    expect(row).not.toHaveProperty("followUpAt");
    expect(row).not.toHaveProperty("notes");
  });
});
