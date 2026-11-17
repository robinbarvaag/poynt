import { describe, expect, test } from "bun:test";
import { SITE_URL } from "./seo";
import {
  ABOUT_PATH,
  FOUNDER_ID,
  ORG_ID,
  WEBSITE_ID,
  aboutPageSchema,
  articleSchema,
  founderReference,
  founderSchema,
  normalizeIsbn,
  organizationSchema,
  parseNorwegianAddress,
  productSchema,
  toIsoDate,
} from "./structured-data";

const ABOUT_URL = `${SITE_URL}${ABOUT_PATH}`;
const founder = {
  name: "Susanne Todnem",
  jobTitle: "Daglig leder",
  description: "Markedsfører og gründer.",
  sameAs: [{ url: "https://linkedin.com/in/x" }, { url: " " }],
};

describe("parseNorwegianAddress", () => {
  test("gate + postnummer/sted på egne linjer", () => {
    expect(parseNorwegianAddress("Kirkegata 1\n4006 Stavanger")).toEqual({
      streetAddress: "Kirkegata 1",
      postalCode: "4006",
      addressLocality: "Stavanger",
    });
  });

  test("kommaseparert på én linje", () => {
    expect(parseNorwegianAddress("Kirkegata 1, 4006 Stavanger")).toEqual({
      streetAddress: "Kirkegata 1",
      postalCode: "4006",
      addressLocality: "Stavanger",
    });
  });

  test("uten postnummer blir alt gateadresse", () => {
    expect(parseNorwegianAddress("Stavanger")).toEqual({
      streetAddress: "Stavanger",
    });
    expect(parseNorwegianAddress("  ")).toEqual({});
  });
});

describe("organizationSchema", () => {
  test("uten bedriftsinfo: bare det som finnes", () => {
    const org = organizationSchema({ name: "Poynt" });
    expect(org["@id"]).toBe(ORG_ID);
    expect(org).not.toHaveProperty("legalName");
    expect(org).not.toHaveProperty("founder");
    expect(org).not.toHaveProperty("sameAs");
    expect(org.areaServed).toEqual({ "@type": "Country", name: "Norge" });
  });

  test("bedriftsinfo gir juridisk navn, org.nr., grunnlegger og brreg-lenke", () => {
    const org = organizationSchema({
      name: "Poynt",
      email: "hei@poynt.no",
      socialLinks: [
        { platform: "linkedin", url: "https://linkedin.com/company/poynt" },
      ],
      company: {
        legalName: "Poynt AS",
        orgNumber: "930 714 151",
        knowsAbout: [{ topic: "Markedsføring" }, { topic: "" }],
        founder: {
          name: "Susanne Todnem",
          jobTitle: "Daglig leder",
          sameAs: [{ url: "https://linkedin.com/in/x" }],
        },
      },
    });

    expect(org).toMatchObject({
      legalName: "Poynt AS",
      taxID: "930714151",
      identifier: { "@type": "PropertyValue", value: "930714151" },
      email: "hei@poynt.no",
      knowsAbout: ["Markedsføring"],
      founder: {
        "@type": "Person",
        "@id": FOUNDER_ID,
        name: "Susanne Todnem",
        jobTitle: "Daglig leder",
        sameAs: ["https://linkedin.com/in/x"],
        worksFor: { "@id": ORG_ID },
      },
      sameAs: [
        "https://linkedin.com/company/poynt",
        "https://virksomhet.brreg.no/nb/oppslag/enheter/930714151",
      ],
    });
  });
});

describe("toIsoDate", () => {
  test("ISO-datoer slipper uendret gjennom", () => {
    expect(toIsoDate("2023-01-25")).toBe("2023-01-25");
    expect(toIsoDate(" 2023-01-25 ")).toBe("2023-01-25");
    expect(toIsoDate("2023-01")).toBe("2023-01");
  });

  test("norsk skrivemåte (DD.MM.ÅÅÅÅ) blir ISO", () => {
    expect(toIsoDate("25.01.2023")).toBe("2023-01-25");
    expect(toIsoDate("5.1.2023")).toBe("2023-01-05");
    expect(toIsoDate("25/01/2023")).toBe("2023-01-25");
  });

  test("bare årstall godtas", () => {
    expect(toIsoDate("2023")).toBe("2023");
  });

  test("tidsstempel fra Payload leses som dato i norsk tid", () => {
    expect(toIsoDate("2026-10-15T00:00:00.000Z")).toBe("2026-10-15");
    // Midnatt norsk sommertid er kvelden før i UTC.
    expect(toIsoDate("2026-10-14T22:00:00.000Z")).toBe("2026-10-15");
  });

  test("uforståelige og umulige datoer gir undefined", () => {
    expect(toIsoDate("januar 2023")).toBeUndefined();
    expect(toIsoDate("31.02.2023")).toBeUndefined();
    expect(toIsoDate("2023-13-01")).toBeUndefined();
    expect(toIsoDate("2023-13")).toBeUndefined();
    expect(toIsoDate("23")).toBeUndefined();
    expect(toIsoDate("")).toBeUndefined();
    expect(toIsoDate(null)).toBeUndefined();
  });
});

describe("organizationSchema – dato, beskrivelse og adresse", () => {
  test("foundingDate normaliseres til ISO 8601", () => {
    const org = organizationSchema({
      company: { foundingDate: "25.01.2023" },
    });
    expect(org.foundingDate).toBe("2023-01-25");
  });

  test("foundingDate som ikke kan tolkes utelates", () => {
    const org = organizationSchema({
      company: { foundingDate: "en gang i 2023" },
    });
    expect(org).not.toHaveProperty("foundingDate");
  });

  test("beskrivelse og postadresse sendes ut når de er fylt inn", () => {
    const org = organizationSchema({
      description: "Markedsføring og AI for små bedrifter.",
      address: "Ramsvigstien 5A, 4015 Stavanger",
    });
    expect(org).toMatchObject({
      description: "Markedsføring og AI for små bedrifter.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Ramsvigstien 5A",
        postalCode: "4015",
        addressLocality: "Stavanger",
        addressCountry: "NO",
      },
    });
  });

  test("uten beskrivelse og adresse utelates begge", () => {
    const org = organizationSchema({ name: "Poynt" });
    expect(org).not.toHaveProperty("description");
    expect(org).not.toHaveProperty("address");
  });

  test("grunnleggeren peker på «Om»-siden", () => {
    const org = organizationSchema({ company: { founder } });
    expect(org.founder).toMatchObject({ "@id": FOUNDER_ID, url: ABOUT_URL });
  });
});

describe("founderSchema / founderReference", () => {
  test("full Person-node med bare utfylte felt", () => {
    expect(founderSchema(founder)).toEqual({
      "@type": "Person",
      "@id": FOUNDER_ID,
      name: "Susanne Todnem",
      url: ABOUT_URL,
      jobTitle: "Daglig leder",
      description: "Markedsfører og gründer.",
      sameAs: ["https://linkedin.com/in/x"],
      worksFor: { "@id": ORG_ID },
    });
    expect(founderSchema({ name: "Susanne Todnem" })).toEqual({
      "@type": "Person",
      "@id": FOUNDER_ID,
      name: "Susanne Todnem",
      url: ABOUT_URL,
      worksFor: { "@id": ORG_ID },
    });
  });

  test("uten navn: null", () => {
    expect(founderSchema(null)).toBeNull();
    expect(founderSchema({ name: "  ", jobTitle: "Daglig leder" })).toBeNull();
    expect(founderReference(undefined)).toBeNull();
  });

  test("henvisningen har samme @id, navn og url", () => {
    expect(founderReference(founder)).toEqual({
      "@type": "Person",
      "@id": FOUNDER_ID,
      name: "Susanne Todnem",
      url: ABOUT_URL,
    });
  });
});

describe("articleSchema", () => {
  const base = {
    title: "Slik bruker du AI",
    url: `${SITE_URL}/blogg/slik-bruker-du-ai`,
    datePublished: "2026-10-01T08:00:00.000Z",
  };

  test("grunnleggeren er forfatter, organisasjonen er utgiver", () => {
    const article = articleSchema({ ...base, author: founder });
    expect(article["@type"]).toBe("Article");
    expect(article.author).toEqual({
      "@type": "Person",
      "@id": FOUNDER_ID,
      name: "Susanne Todnem",
      url: ABOUT_URL,
    });
    expect(article.publisher).toEqual({ "@id": ORG_ID });
  });

  test("uten grunnlegger faller forfatteren tilbake på organisasjonen", () => {
    const article = articleSchema({ ...base, author: { name: "" } });
    expect(article.author).toMatchObject({
      "@type": "Organization",
      "@id": ORG_ID,
    });
  });

  test("BlogPosting med kategorier som articleSection", () => {
    const post = articleSchema({
      ...base,
      type: "BlogPosting",
      sections: ["AI", null, "", "LinkedIn"],
    });
    expect(post["@type"]).toBe("BlogPosting");
    expect(post.articleSection).toEqual(["AI", "LinkedIn"]);
    expect(articleSchema(base)).not.toHaveProperty("articleSection");
  });
});

describe("aboutPageSchema", () => {
  test("profilside med grunnleggeren som hovedperson", () => {
    const page = aboutPageSchema({
      name: "Om Susanne Todnem og Poynt",
      description: "Hvem står bak Poynt?",
      founder,
      dateModified: "2026-11-01T10:00:00.000Z",
    });
    expect(page).toMatchObject({
      "@context": "https://schema.org",
      "@type": ["ProfilePage", "AboutPage"],
      "@id": `${ABOUT_URL}#webpage`,
      url: ABOUT_URL,
      name: "Om Susanne Todnem og Poynt",
      description: "Hvem står bak Poynt?",
      dateModified: "2026-11-01T10:00:00.000Z",
      mainEntity: {
        "@type": "Person",
        "@id": FOUNDER_ID,
        name: "Susanne Todnem",
      },
      about: { "@id": ORG_ID },
      isPartOf: { "@id": WEBSITE_ID },
    });
    expect(page).not.toHaveProperty("dateCreated");
  });

  test("uten grunnlegger i innstillingene: ingen node", () => {
    expect(aboutPageSchema({ name: "Om", founder: null })).toBeNull();
  });
});

describe("normalizeIsbn", () => {
  test("fjerner bindestreker og mellomrom", () => {
    expect(normalizeIsbn("978-82-303-7533-4")).toBe("9788230375334");
    expect(normalizeIsbn("82 303 7533 x")).toBe("823037533X");
  });

  test("feil lengde eller tekst gir undefined", () => {
    expect(normalizeIsbn("12345")).toBeUndefined();
    expect(normalizeIsbn("ukjent")).toBeUndefined();
    expect(normalizeIsbn(null)).toBeUndefined();
  });
});

describe("productSchema", () => {
  const url = `${SITE_URL}/produkter/verdifull-vekst-i-din-bedrift`;
  const base = { name: "Verdifull vekst i din bedrift", url, price: 399 };

  test("vanlig produkt er uendret: bare Product", () => {
    const product = productSchema(base);
    expect(product["@type"]).toBe("Product");
    expect(product).not.toHaveProperty("@id");
    expect(product).not.toHaveProperty("isbn");
    expect(product).not.toHaveProperty("author");
    expect(product).not.toHaveProperty("publisher");
    expect(product.offers).toMatchObject({ price: 399, priceCurrency: "NOK" });
  });

  test("boka blir Product + Book med ISBN, forfatter og utgivelsesdato", () => {
    const book = productSchema({
      ...base,
      book: {
        isbn: "978-82-303-7533-4",
        datePublished: "2026-10-15T00:00:00.000Z",
        author: founder,
      },
    });
    expect(book).toMatchObject({
      "@type": ["Product", "Book"],
      "@id": `${url}#book`,
      isbn: "9788230375334",
      author: { "@type": "Person", "@id": FOUNDER_ID, name: "Susanne Todnem" },
      publisher: { "@id": ORG_ID },
      datePublished: "2026-10-15",
      inLanguage: "nb",
      offers: { "@type": "Offer", price: 399 },
    });
  });

  test("manglende bokfakta utelates i stedet for å gjettes", () => {
    const book = productSchema({ ...base, book: { isbn: "", author: null } });
    expect(book["@type"]).toEqual(["Product", "Book"]);
    expect(book).not.toHaveProperty("isbn");
    expect(book).not.toHaveProperty("author");
    expect(book).not.toHaveProperty("datePublished");
  });
});
