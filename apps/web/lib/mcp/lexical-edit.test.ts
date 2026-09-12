import { describe, expect, test } from "bun:test";
import { applyTextEdits, markdownLossyParts } from "./lexical-edit";

const doc = {
  root: {
    type: "root",
    children: [
      {
        type: "heading",
        tag: "h2",
        children: [{ type: "text", text: "Gammel overskrift" }],
      },
      {
        type: "paragraph",
        children: [
          { type: "text", text: "Poynt hjelper. Poynt lærer bort." },
          {
            type: "link",
            children: [{ type: "text", text: "Les mer" }],
          },
        ],
      },
    ],
  },
};

describe("applyTextEdits", () => {
  test("erstatter i alle tekstnoder uten å endre originalen", () => {
    const { content, results } = applyTextEdits(doc, [
      { find: "Gammel overskrift", replace: "Ny overskrift" },
      { find: "Poynt", replace: "On Poynt" },
      { find: "finnes ikke", replace: "x" },
    ]);
    expect(results.map((r) => r.matches)).toEqual([1, 2, 0]);
    expect(content.root.children[0].children[0].text).toBe("Ny overskrift");
    expect(content.root.children[1].children[0].text).toBe(
      "On Poynt hjelper. On Poynt lærer bort."
    );
    expect(doc.root.children[0].children[0].text).toBe("Gammel overskrift");
  });
});

describe("markdownLossyParts", () => {
  test("rent dokument er trygt", () => {
    expect(markdownLossyParts(doc)).toEqual([]);
  });

  test("produktkort, bilde og nummerert liste flagges", () => {
    expect(
      markdownLossyParts({
        root: {
          type: "root",
          children: [
            { type: "block" },
            { type: "upload" },
            { type: "list", listType: "number", children: [] },
          ],
        },
      })
    ).toEqual([
      "produktkort/blokk",
      "innfelt bilde",
      "nummerert liste / sjekkliste",
    ]);
  });
});
