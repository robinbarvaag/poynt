import { describe, expect, test } from "bun:test";
import { markdownLossyParts, productCardIds } from "./lexical-edit";
import {
  lexicalToMarkdown,
  markdownToLexical,
  parseProductCard,
} from "./lexical-markdown";

describe("produktkort i markdown", () => {
  test("leser id, etikett, tekst og kjøpsknapp", () => {
    expect(
      parseProductCard(
        '[produktkort id=12 etikett="Anbefalt" tekst="Si \\"hei\\"" kjøpsknapp=nei]'
      )
    ).toEqual({
      product: 12,
      eyebrow: "Anbefalt",
      text: 'Si "hei"',
      showAddToCart: false,
    });
    expect(parseProductCard("[produktkort id=7]")).toEqual({
      product: 7,
      showAddToCart: true,
    });
    expect(parseProductCard("[produktkort etikett=x]")).toBeNull();
  });

  test("rundtur markdown → Lexical → markdown bevarer kortet", () => {
    const md =
      '## Kom i gang\n\nLes dette først.\n\n[produktkort id=12 tekst="Alt i én PDF" kjøpsknapp=nei]\n\nSiste avsnitt.';
    const doc = markdownToLexical(md, { productCards: true });
    expect(productCardIds(doc)).toEqual([12]);
    expect(markdownLossyParts(doc)).toEqual([]);
    expect(lexicalToMarkdown(doc)).toBe(md);
  });

  test("uten productCards blir linjen vanlig tekst", () => {
    const doc = markdownToLexical("[produktkort id=12]");
    expect(productCardIds(doc)).toEqual([]);
  });

  test("ugyldig kort kaster", () => {
    expect(() =>
      markdownToLexical("[produktkort id=abc]", { productCards: true })
    ).toThrow(/gyldig id/);
  });
});
