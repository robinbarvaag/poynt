import { describe, expect, test } from "bun:test";
import {
  type ChannelRates,
  type EconomySettings,
  breakEven,
  coverage,
  maxReturnPercent,
  returnRisk,
  totals,
  unitEconomics,
} from "./economy";

/** Susannes faktiske avtale. Trykk er en opplagskostnad, ikke en sats per bok. */
const base: EconomySettings = {
  listPrice: 399,
  editorPercent: 10,
  editorBasis: "brutto",
};

const bokhandel: ChannelRates = {
  key: "norli",
  label: "Norli",
  retailerPercent: 50,
  distributionPercent: 0,
  distributionPerCopy: 0,
  transactionPercent: 0,
  transactionPerCopy: 0,
};

const egen: ChannelRates = {
  key: "egen",
  label: "Egen nettbutikk",
  retailerPercent: 0,
  distributionPercent: 0,
  distributionPerCopy: 0,
  transactionPercent: 0,
  transactionPerCopy: 0,
};

describe("unitEconomics", () => {
  test("bokhandel med redaktør av brutto: 399 − 199,50 − 39,90", () => {
    const unit = unitEconomics(base, bokhandel);
    expect(unit.retailerCut).toBe(199.5);
    expect(unit.editorCut).toBe(39.9);
    expect(unit.net).toBe(159.6);
  });

  test("bokhandel med redaktør av netto: 10 % av det som står igjen", () => {
    const unit = unitEconomics({ ...base, editorBasis: "netto" }, bokhandel);
    expect(unit.editorCut).toBe(19.95);
    expect(unit.net).toBe(179.55);
  });

  test("egen butikk: bare redaktørens kutt, og grunnlaget spiller ingen rolle", () => {
    expect(unitEconomics(base, egen).net).toBe(359.1);
    expect(unitEconomics({ ...base, editorBasis: "netto" }, egen).net).toBe(
      359.1
    );
  });

  test("distribusjon spiser av nettoen — den påløper per salg", () => {
    const unit = unitEconomics(base, {
      ...bokhandel,
      distributionPercent: 5,
      distributionPerCopy: 3,
    });
    expect(unit.distributionCut).toBe(22.95);
    expect(unit.net).toBe(136.65);
  });

  test("kortgebyr trekkes i egen butikk: 1,4 % + 2 kr", () => {
    const unit = unitEconomics(base, {
      ...egen,
      transactionPercent: 1.4,
      transactionPerCopy: 2,
    });
    expect(unit.transactionFee).toBe(7.59);
    expect(unit.net).toBe(351.51);
  });

  test("trykk finnes ikke per bok — opplaget føres som utgift", () => {
    const unit = unitEconomics(base, bokhandel);
    expect(unit).not.toHaveProperty("printCost");
    // Hele opplaget ligger i utgiftssummen break-even skal dekke, så å trekke
    // det fra hvert salg i tillegg ville betalt trykkeriet to ganger.
    expect(unit.net).toBe(159.6);
  });
});

describe("totals", () => {
  test("summerer på tvers av kanaler med ulik margin", () => {
    const sum = totals(base, [bokhandel, egen], { norli: 100, egen: 20 });
    expect(sum.copies).toBe(120);
    expect(sum.revenue).toBe(399 * 120);
    // 100 × 159,60 + 20 × 359,10
    expect(sum.net).toBe(23142);
    expect(sum.retailerCut).toBe(19950);
  });

  test("kanaler uten salg påvirker ingenting", () => {
    expect(totals(base, [bokhandel, egen], { norli: 0 }).net).toBe(0);
  });
});

describe("breakEven", () => {
  const utgifter = 276169;

  test("bokhandel krever mer enn dobbelt så mange bøker som egen butikk", () => {
    expect(breakEven(base, bokhandel, utgifter).copiesNeeded).toBe(1731);
    expect(breakEven(base, egen, utgifter).copiesNeeded).toBe(770);
  });

  test("redaktør av netto senker terskelen i bokhandel", () => {
    expect(
      breakEven({ ...base, editorBasis: "netto" }, bokhandel, utgifter)
        .copiesNeeded
    ).toBe(1539);
  });

  test("null når boka ikke tjener penger — ingen Infinity i dashbordet", () => {
    const tapsprosjekt = breakEven(
      base,
      { ...bokhandel, distributionPerCopy: 400 },
      utgifter
    );
    expect(tapsprosjekt.netPerCopy).toBeLessThan(0);
    expect(tapsprosjekt.copiesNeeded).toBeNull();
  });
});

describe("coverage", () => {
  test("regner gjenstående bøker ut fra faktisk salgsmiks", () => {
    const earned = totals(base, [bokhandel, egen], { norli: 100, egen: 20 });
    const dekning = coverage(earned, 276169);
    expect(dekning.averageNetPerCopy).toBe(192.85);
    expect(dekning.result).toBe(23142 - 276169);
    // (276169 − 23142) / 192,85
    expect(dekning.remainingAtCurrentMix).toBe(1313);
    expect(dekning.coveredPercent).toBeCloseTo(8.38, 1);
  });

  test("ingen salg ennå gir ingen prognose, ikke en deling på null", () => {
    const tomt = totals(base, [bokhandel], {});
    const dekning = coverage(tomt, 276169);
    expect(dekning.averageNetPerCopy).toBeNull();
    expect(dekning.remainingAtCurrentMix).toBeNull();
    expect(dekning.coveredPercent).toBe(0);
  });

  test("i pluss: ingenting gjenstår", () => {
    const earned = totals(base, [egen], { egen: 1000 });
    expect(coverage(earned, 276169).remainingAtCurrentMix).toBe(0);
  });
});

describe("returnRisk", () => {
  // Susannes faktiske situasjon 22.09.2026: Norli 400 innkjøp + 57
  // forhåndssalg, ARK 300 innkjøp, 453 669 kr i utgifter.
  const norli: ChannelRates = { ...bokhandel, maxReturnPercent: 50 };
  const ark: ChannelRates = { ...bokhandel, key: "ark", label: "ARK" };
  ark.maxReturnPercent = 50;
  const utgifter = 453669;
  const earned = totals(base, [norli, ark, egen], {
    norli: 457,
    ark: 300,
    egen: 0,
  });
  // Bare innkjøpet kan returneres — ikke de 57 forhåndsbestilte.
  const returnable = { norli: 400, ark: 300 };

  test("verst tenkelig: halve innkjøpet tilbake, netto for dem forsvinner", () => {
    const risk = returnRisk(
      base,
      [norli, ark, egen],
      returnable,
      earned,
      utgifter,
      50
    );
    expect(risk.copiesReturned).toBe(350);
    // 350 × 159,60
    expect(risk.netLost).toBe(55860);
    expect(risk.netAfter).toBe(earned.net - 55860);
    expect(risk.after.coveredPercent).toBeLessThan(
      coverage(earned, utgifter).coveredPercent
    );
  });

  test("slideren kappes ved hver kanals returrett — egen butikk gir aldri retur", () => {
    const risk = returnRisk(
      base,
      [norli, egen],
      { norli: 400, egen: 100 },
      earned,
      utgifter,
      80
    );
    const rows = Object.fromEntries(risk.channels.map((row) => [row.key, row]));
    expect(rows.norli.effectivePercent).toBe(50);
    expect(rows.norli.returned).toBe(200);
    expect(rows.egen.effectivePercent).toBe(0);
    expect(rows.egen.returned).toBe(0);
  });

  test("0 % gir samme dekning som før", () => {
    const risk = returnRisk(
      base,
      [norli, ark],
      returnable,
      earned,
      utgifter,
      0
    );
    expect(risk.netLost).toBe(0);
    expect(risk.after).toEqual(coverage(earned, utgifter));
  });

  test("returer som allerede er ført har senket grunnlaget", () => {
    const risk = returnRisk(
      base,
      [norli],
      { norli: 400 - 100 },
      earned,
      utgifter,
      50
    );
    expect(risk.copiesReturned).toBe(150);
  });

  test("maxReturnPercent finner høyeste returrett, 0 uten kanaler", () => {
    expect(maxReturnPercent([norli, egen])).toBe(50);
    expect(maxReturnPercent([egen])).toBe(0);
    expect(maxReturnPercent([])).toBe(0);
  });
});
