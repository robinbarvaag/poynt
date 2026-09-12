import { describe, expect, test } from "bun:test";
import {
  caseStudyDocument,
  faqSection,
  productDocument,
  renderMarkdownDocument,
} from "./document-to-markdown";

const ctx = { siteUrl: "https://poynt.no" };

describe("renderMarkdownDocument", () => {
  test("frontmatter med gyldige YAML-strenger, tomme felt utelates", () => {
    const md = renderMarkdownDocument({
      title: 'Si "hei"',
      description: "Linje 1\nlinje 2",
      url: "https://poynt.no/x",
      type: "page",
      extra: { customer: "", price: 100 },
      sections: ["Innhold", "  "],
    });
    expect(md).toBe(
      [
        "---",
        'title: "Si \\"hei\\""',
        'description: "Linje 1 linje 2"',
        'url: "https://poynt.no/x"',
        'type: "page"',
        'language: "nb-NO"',
        "price: 100",
        "---",
        "",
        '# Si "hei"',
        "",
        "Innhold",
        "",
      ].join("\n")
    );
  });

  test("uten frontmatter får dokumentet en kildekommentar", () => {
    const md = renderMarkdownDocument(
      {
        title: "A",
        url: "https://poynt.no/a",
        type: "page",
        sections: ["[x](/b)"],
      },
      { frontmatter: false, siteUrl: "https://poynt.no" }
    );
    expect(md).toBe(
      "<!-- Kilde: https://poynt.no/a -->\n\n# A\n\n[x](https://poynt.no/b)\n"
    );
  });
});

test("faqSection hopper over ufullstendige rader", () => {
  expect(faqSection([{ question: "Q", answer: "" }])).toBe("");
  expect(faqSection([{ question: "Q", answer: "A" }])).toBe(
    "## Ofte stilte spørsmål\n\n### Q\n\nA"
  );
});

test("productDocument: pris med intervall og førpris", () => {
  const doc = productDocument(
    {
      name: "Medlemskap",
      slug: "medlemskap",
      price: 1490,
      compareAtPrice: 1990,
      recurringInterval: 1,
      highlights: [{ text: "Fellesskap" }],
    },
    { ...ctx, typeLabel: "Medlemskap" }
  );
  expect(doc.url).toBe("https://poynt.no/produkter/medlemskap");
  expect(doc.extra).toMatchObject({ price: 1490, currency: "NOK" });
  const md = renderMarkdownDocument(doc);
  expect(md).toContain("**Pris:** 1 490 kr / mnd (før 1 990 kr) (inkl. mva)");
  expect(md).toContain("- Fellesskap");
});

test("caseStudyDocument: resultater og sitat", () => {
  const md = renderMarkdownDocument(
    caseStudyDocument(
      {
        title: "Vekst",
        slug: "vekst",
        customer: "Bedrift AS",
        results: [{ value: "+40 %", label: "salg" }],
        quote: { text: "Supert", author: "Ola", role: "CEO" },
      },
      ctx
    )
  );
  expect(md).toContain("## Resultater\n\n- **+40 %** salg");
  expect(md).toContain("> Supert\n>\n> — Ola, CEO");
});
