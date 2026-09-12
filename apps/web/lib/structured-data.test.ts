import { describe, expect, test } from "bun:test";
import {
  FOUNDER_ID,
  ORG_ID,
  organizationSchema,
  parseNorwegianAddress,
} from "./structured-data";

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
