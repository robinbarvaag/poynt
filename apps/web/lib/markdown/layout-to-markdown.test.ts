import { describe, expect, test } from "bun:test";
import {
  absolutizeMarkdownLinks,
  blockToMarkdown,
  layoutToMarkdown,
} from "./layout-to-markdown";

const ctx = { siteUrl: "https://poynt.no" };

describe("blockToMarkdown", () => {
  test("hero: tittel, undertekst og CTA-lenker (relative blir absolutte)", () => {
    const md = blockToMarkdown(
      {
        blockType: "hero",
        title: "Vekst med KI",
        subtitle: "Foredrag og rådgivning",
        primaryCta: { text: "Ta kontakt", url: "/kontakt" },
        secondaryCta: { text: "Anker", url: "#tjenester" },
        imageDuotone: true,
      },
      ctx
    );
    expect(md).toBe(
      "## Vekst med KI\n\nForedrag og rådgivning\n\n[Ta kontakt](https://poynt.no/kontakt)\n\nAnker"
    );
  });

  test("faq: spørsmål blir underoverskrifter", () => {
    const md = blockToMarkdown(
      {
        blockType: "faq",
        eyebrow: "FAQ",
        title: "Spørsmål",
        items: [{ question: "Hva koster det?", answer: "Det kommer an på." }],
      },
      ctx
    );
    expect(md).toBe("## Spørsmål\n\n### Hva koster det?\n\nDet kommer an på.");
  });

  test("featureGrid: aksent-stjerne fjernes, lenke etter tekst", () => {
    const md = blockToMarkdown(
      {
        blockType: "featureGrid",
        title: "Hvorfor",
        columns: "3",
        features: [
          {
            title: "Lær raskere*",
            text: "Kort tekst",
            linkLabel: "Les mer",
            linkUrl: "https://example.com",
          },
        ],
      },
      ctx
    );
    expect(md).toContain("### Lær raskere\n\nKort tekst");
    expect(md).toContain("[Les mer](https://example.com)");
  });

  test("statsBand: nøkkeltall som punktliste", () => {
    const md = blockToMarkdown(
      {
        blockType: "statsBand",
        title: "Tall",
        stats: [
          { value: "12", suffix: "+", label: "år erfaring" },
          { value: "500", label: "kunder" },
        ],
      },
      ctx
    );
    expect(md).toBe("## Tall\n\n- **12+** år erfaring\n- **500** kunder");
  });

  test("testimonials: sitat med tilskrivelse", () => {
    const md = blockToMarkdown(
      {
        blockType: "testimonials",
        title: "Hva kundene sier",
        testimonials: [
          {
            quote: "Veldig nyttig.",
            author: "Kari",
            role: "Daglig leder",
            company: "Bedrift AS",
            rating: 5,
          },
        ],
      },
      ctx
    );
    expect(md).toBe(
      "## Hva kundene sier\n\n> Veldig nyttig.\n>\n> — Kari, Daglig leder, Bedrift AS"
    );
  });

  test("richText rendres som markdown", () => {
    const md = blockToMarkdown(
      {
        blockType: "content",
        richText: {
          root: {
            children: [
              {
                type: "heading",
                tag: "h2",
                children: [{ type: "text", text: "Om oss" }],
              },
              {
                type: "paragraph",
                children: [{ type: "text", text: "Hei", format: 1 }],
              },
            ],
          },
        },
      },
      ctx
    );
    expect(md).toBe("## Om oss\n\n**Hei**");
  });

  test("ukjente blokker gir tom streng", () => {
    expect(blockToMarkdown({ blockType: "finnesIkke", title: "x" }, ctx)).toBe(
      ""
    );
  });
});

describe("layoutToMarkdown", () => {
  test("hopper over tomme blokker og skiller seksjoner", () => {
    const md = layoutToMarkdown(
      [
        { blockType: "hero", title: "A" },
        { blockType: "media" },
        { blockType: "steps", title: "B", steps: [{ title: "1", text: "x" }] },
      ],
      ctx
    );
    expect(md).toBe("## A\n\n## B\n\n### 1\n\nx");
  });
});

test("absolutizeMarkdownLinks rører ikke absolutte eller protokoll-relative", () => {
  expect(
    absolutizeMarkdownLinks(
      "[a](/om) [b](https://x.no) [c](//cdn.no)",
      ctx.siteUrl
    )
  ).toBe("[a](https://poynt.no/om) [b](https://x.no) [c](//cdn.no)");
});
