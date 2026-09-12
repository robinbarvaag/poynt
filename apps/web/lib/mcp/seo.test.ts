import { describe, expect, test } from "bun:test";
import {
  analyseRendered,
  analyseSeo,
  effectiveSeo,
  findDuplicates,
  parseHeadExtras,
  resolveOgImageChoice,
} from "./seo";

const ogMedia = {
  id: 1,
  url: "/media/a.jpg",
  alt: "Susanne holder foredrag",
  width: 1200,
  height: 630,
  mimeType: "image/jpeg",
};

describe("effectiveSeo", () => {
  test("blogg faller tilbake til tittel og utdrag", () => {
    const seo = effectiveSeo({
      collection: "blog-posts",
      title: "Slik lager du en innholdsplan",
      slug: "innholdsplan",
      excerpt: "Kort utdrag",
    });
    expect(seo.fullTitle).toBe("Slik lager du en innholdsplan | Poynt");
    expect(seo.description).toBe("Kort utdrag");
    expect(seo.descriptionSource).toBe("utdrag");
    expect(seo.path).toBe("/blogg/innholdsplan");
  });

  test("sider har ingen utdrag-fallback", () => {
    const seo = effectiveSeo({
      collection: "pages",
      title: "Om",
      slug: "om",
      excerpt: "ignoreres",
    });
    expect(seo.description).toBe("");
  });

  test("tjenester får «| Tjenester» og suffiks ryddes", () => {
    expect(
      effectiveSeo({ collection: "services", title: "Rådgivning" }).fullTitle
    ).toBe("Rådgivning | Tjenester | Poynt");
    expect(
      effectiveSeo({
        collection: "pages",
        title: "x",
        metaTitle: "Kurs | Poynt",
      }).fullTitle
    ).toBe("Kurs | Poynt");
  });
});

describe("resolveOgImageChoice", () => {
  test("1,91:1 brukes direkte, andre aspekt i merkevarekort", () => {
    expect(
      resolveOgImageChoice({
        collection: "pages",
        title: "x",
        metaImage: ogMedia,
      }).kind
    ).toBe("bilde");
    expect(
      resolveOgImageChoice({
        collection: "pages",
        title: "x",
        fallbackImage: { ...ogMedia, width: 800, height: 800 },
      })
    ).toMatchObject({ kind: "merkevarekort-med-bilde", source: "hovedbilde" });
    expect(resolveOgImageChoice({ collection: "pages", title: "x" }).kind).toBe(
      "merkevarekort"
    );
  });
});

describe("analyseSeo", () => {
  const fields = (f: ReturnType<typeof analyseSeo>) =>
    f.map((x) => `${x.level}:${x.field}`);

  test("side uten beskrivelse er feil", () => {
    expect(
      fields(analyseSeo({ collection: "pages", title: "Om oss hos Poynt" }))
    ).toContain("feil:metaDescription");
  });

  test("for lang tittel, suffiks og manglende alt", () => {
    const f = fields(
      analyseSeo({
        collection: "blog-posts",
        title: "x",
        metaTitle:
          "En altfor lang meta-tittel som helt sikkert blir kuttet av Google | Poynt",
        metaDescription: "a".repeat(130),
        excerpt: "u",
        metaImage: { ...ogMedia, alt: "" },
      })
    );
    expect(f).toContain("advarsel:metaTitle");
    expect(f).toContain("advarsel:alt");
  });

  test("god blogg gir ingen advarsler", () => {
    const findings = analyseSeo({
      collection: "blog-posts",
      title: "x",
      metaTitle: "Slik lager du en innholdsplan som faktisk holder",
      metaDescription:
        "Innholdsplanen ryker etter to uker? Her er en enkel mal som tåler en travel hverdag, med eksempler fra ekte bedrifter og et konkret første steg.",
      excerpt: "utdrag",
      metaImage: ogMedia,
      contentMarkdown: `## Start her\n\n${"ord ".repeat(700)} [tjeneste](/tjenester/x)`,
    });
    expect(findings.filter((f) => f.level !== "tips")).toEqual([]);
  });

  test("lang tekst uten mellomtitler og med H1", () => {
    const f = fields(
      analyseSeo({
        collection: "blog-posts",
        title: "x",
        contentMarkdown: `# Tittel\n\n${"ord ".repeat(400)}`,
      })
    );
    expect(f.filter((x) => x === "advarsel:content")).toHaveLength(2);
  });
});

test("findDuplicates grupperer likt innhold", () => {
  const d = findDuplicates([
    { key: "a", fullTitle: "Kurs | Poynt", description: "" },
    { key: "b", fullTitle: "kurs | poynt", description: "" },
    { key: "c", fullTitle: "Annet | Poynt", description: "" },
  ]);
  expect(d.titles).toEqual([{ value: "kurs | poynt", documents: ["a", "b"] }]);
  expect(d.descriptions).toEqual([]);
});

test("parseHeadExtras + analyseRendered", () => {
  const html = `<head><link rel="canonical" href="https://poynt.no/om"/>
    <script type="application/ld+json">{"@context":"x","@graph":[{"@type":"Organization"},{"@type":"FAQPage"}]}</script>
    </head><body><h1>Om</h1></body>`;
  const extras = parseHeadExtras(html);
  expect(extras).toEqual({
    canonical: "https://poynt.no/om",
    h1Count: 1,
    jsonLdTypes: ["Organization", "FAQPage"],
  });
  const f = analyseRendered(
    {
      ...extras,
      title: "Om | Poynt",
      description: "d",
      ogImage: "https://poynt.no/og.jpg",
      ogTitle: "Om | Poynt",
      twitterCard: "summary_large_image",
      robots: "noindex, nofollow",
    },
    "https://poynt.no/om/"
  );
  expect(f.map((x) => x.field)).toEqual(["robots"]);
});
