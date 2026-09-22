import { describe, expect, test } from "bun:test";
import { type MilestoneInput, milestones } from "./milestones";

const now: MilestoneInput = {
  copies: 757,
  ownShopCopies: 0,
  net: 120817.2,
  expenses: 453669,
  printRun: 2000,
  released: false,
  storesWithBook: 0,
  regionsWithBook: 0,
  regionsTotal: 15,
  sellThrough: 0,
};

const byKey = (input: MilestoneInput) =>
  Object.fromEntries(milestones(input).map((m) => [m.key, m]));

describe("milestones", () => {
  test("innsalget før lansering: 500 nådd, 1 000 ikke", () => {
    const m = byKey(now);
    expect(m["first-sale"].reached).toBe(true);
    expect(m["500"].reached).toBe(true);
    expect(m["1000"].reached).toBe(false);
    // Formattereren bruker smalt hardt mellomrom som tusenskille — samme kall
    // i forventningen, så testen ikke avhenger av hvilket mellomrom det er.
    expect(m["1000"].detail).toBe(
      `757 av ${(1000).toLocaleString("nb-NO")} bøker`
    );
    expect(m["print-run"].detail).toBe(
      `757 av ${(2000).toLocaleString("nb-NO")} trykte`
    );
  });

  test("økonomien: 27 % dekket er verken halvveis eller i null", () => {
    const m = byKey(now);
    expect(m.half.reached).toBe(false);
    expect(m.half.detail).toBe("27 % av utgiftene dekket");
    expect(m["break-even"].reached).toBe(false);
  });

  test("butikkene teller først når noen faktisk har boka", () => {
    const m = byKey({ ...now, storesWithBook: 3, regionsWithBook: 2 });
    expect(m["first-store"].reached).toBe(true);
    expect(m["50-stores"].detail).toBe("3 av 50 butikker");
    expect(m["all-regions"].detail).toBe("2 av 15 fylker");
  });

  test("uten opplag og fylker finnes ikke de milepælene", () => {
    const keys = milestones({ ...now, printRun: null, regionsTotal: 0 }).map(
      (m) => m.key
    );
    expect(keys).not.toContain("print-run");
    expect(keys).not.toContain("all-regions");
  });

  test("i pluss", () => {
    const m = byKey({ ...now, net: 500000 });
    expect(m["break-even"].reached).toBe(true);
    expect(m["break-even"].detail).toBe("I pluss!");
  });
});
