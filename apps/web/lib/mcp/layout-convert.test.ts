import { describe, expect, test } from "bun:test";
import { LayoutError, toMcpLayout, toPayloadLayout } from "./layout-convert";

type Rec = Record<string, unknown>;

describe("layout-convert", () => {
  test("vekst-blokker får bokinnholdet når feltene utelates", () => {
    const [wheel, ritual, calculator] = toPayloadLayout([
      { blockType: "changeWheel", blockName: "Endringshjulet" },
      { blockType: "salesRitual" },
      { blockType: "growthCalculator" },
    ]);
    expect(wheel.blockName).toBe("Endringshjulet");
    expect((wheel.areas as unknown[]).length).toBe(4);
    expect(String(wheel.aiPrompt)).toContain("{resultat}");
    expect(ritual.ritualName).toBe("Omsetnings-onsdag");
    expect(ritual.weekday).toBe("WE");
    expect((ritual.checklist as unknown[]).length).toBeGreaterThan(0);
    expect(calculator.calculator).toBe("profit");
    expect((calculator.profitExample as Rec).price).toBe(140);
  });

  test("egne verdier overstyrer standardinnholdet", () => {
    const [cards] = toPayloadLayout([
      { blockType: "mythCards", myths: [{ lie: "X", truth: "Y" }] },
    ]);
    expect(cards.myths).toEqual([{ lie: "X", truth: "Y" }]);
  });

  test("standardverdier deles ikke mellom blokker", () => {
    const [first, second] = toPayloadLayout([
      { blockType: "chapterPortal" },
      { blockType: "chapterPortal" },
    ]);
    (first.doors as Rec[])[0].title = "Endret";
    expect((second.doors as Rec[])[0].title).toBe("Visjon");
  });

  test("påkrevde felt uten standardverdi avvises fortsatt", () => {
    expect(() =>
      toPayloadLayout([{ blockType: "mythCards", myths: [{ lie: "X" }] }])
    ).not.toThrow();
    expect(() => toPayloadLayout([{ blockType: "finnesIkke" }])).toThrow(
      LayoutError
    );
  });

  test("blokk-navnet overlever rundturen, id-er gjør det ikke", () => {
    const [block] = toMcpLayout([
      { id: "abc", blockType: "steps", blockName: "Arbeidsflyter", steps: [] },
    ]);
    expect(block.blockName).toBe("Arbeidsflyter");
    expect(block.id).toBeUndefined();
    const [unnamed] = toMcpLayout([{ blockType: "steps", blockName: null }]);
    expect("blockName" in unnamed).toBe(false);
  });
});
