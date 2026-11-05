import { describe, expect, test } from "bun:test";
import { axisCap } from "./sales-chart";

const day = (soldIn: number, sellThrough: number) => ({
  date: "2026-10-20",
  soldIn,
  sellThrough,
});

describe("axisCap", () => {
  test("følger hyllesalget og kapper de store innkjøpene", () => {
    const axis = axisCap([
      day(300, 0),
      day(303, 0),
      day(56, 0),
      day(8, 23),
      day(2, 3),
    ]);
    expect(axis?.cap).toBe(25);
    expect(axis?.ticks).toEqual([0, 5, 10, 15, 20, 25]);
  });

  test("tar med små innkjøp av samme størrelse som hyllesalget", () => {
    expect(axisCap([day(300, 0), day(12, 0), day(0, 7)])?.cap).toBe(15);
  });

  test("vanlig akse uten hyllesalg", () => {
    expect(axisCap([day(300, 0), day(56, 0)])).toBeNull();
  });

  test("vanlig akse når ingenting stikker over", () => {
    expect(axisCap([day(4, 6), day(2, 3)])).toBeNull();
  });
});
