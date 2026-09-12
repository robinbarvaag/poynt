import { describe, expect, test } from "bun:test";
import {
  isExternalUrl,
  lexicalLinkHref,
  phoneHref,
  resolveLexicalLink,
} from "./link-fields";

const SITE = "https://poynt.no";

describe("isExternalUrl", () => {
  test("relative adresser og ankre er interne", () => {
    expect(isExternalUrl("/om", SITE)).toBe(false);
    expect(isExternalUrl("#topp", SITE)).toBe(false);
    expect(isExternalUrl("kontakt", SITE)).toBe(false);
  });

  test("samme host (med/uten www) er intern", () => {
    expect(isExternalUrl("https://poynt.no/om", SITE)).toBe(false);
    expect(isExternalUrl("https://www.poynt.no/om", SITE)).toBe(false);
  });

  test("andre nettsteder er eksterne", () => {
    expect(isExternalUrl("https://example.com", SITE)).toBe(true);
    expect(isExternalUrl("www.example.com", SITE)).toBe(true);
    expect(isExternalUrl("//cdn.example.com/x", SITE)).toBe(true);
  });
});

describe("resolveLexicalLink", () => {
  test("forsiden", () => {
    expect(resolveLexicalLink({ linkType: "home" })).toEqual({
      kind: "internal",
      href: "/",
      newTab: false,
    });
  });

  test("intern side via populert dokument", () => {
    expect(
      resolveLexicalLink({
        linkType: "internal",
        doc: { relationTo: "pages", value: { id: 1, slug: "om" } },
      })
    ).toEqual({ kind: "internal", href: "/om", newTab: false });
    expect(
      resolveLexicalLink({
        linkType: "internal",
        doc: { relationTo: "pages", value: { id: 1, slug: "forside" } },
      })
    ).toEqual({ kind: "internal", href: "/", newTab: false });
    expect(
      resolveLexicalLink({
        linkType: "internal",
        doc: { relationTo: "blog-posts", value: { id: 2, slug: "hei" } },
      })?.href
    ).toBe("/blogg/hei");
  });

  test("intern lenke uten populert dokument gir null (ikke dødt #)", () => {
    expect(
      resolveLexicalLink({
        linkType: "internal",
        doc: { relationTo: "pages", value: 1 },
      })
    ).toBeNull();
  });

  test("e-post og telefon", () => {
    expect(
      resolveLexicalLink({ linkType: "email", email: " hei@poynt.no " })
    ).toEqual({
      kind: "email",
      href: "mailto:hei@poynt.no",
      value: "hei@poynt.no",
    });
    expect(
      resolveLexicalLink({ linkType: "phone", phone: "+47 123 45 678" })
    ).toEqual({
      kind: "phone",
      href: "tel:+4712345678",
      value: "+47 123 45 678",
    });
    expect(phoneHref("(+47) 12-34-56-78")).toBe("tel:+4712345678");
  });

  test("gamle mailto:/tel: i URL-feltet får samme oppførsel", () => {
    expect(
      resolveLexicalLink({ linkType: "custom", url: "mailto:hei@poynt.no" })
    ).toEqual({
      kind: "email",
      href: "mailto:hei@poynt.no",
      value: "hei@poynt.no",
    });
    expect(
      resolveLexicalLink({ linkType: "custom", url: "tel:+47 12345678" })
    ).toMatchObject({ kind: "phone", href: "tel:+4712345678" });
  });

  test("nettadresse: ekstern vs. egen", () => {
    expect(
      resolveLexicalLink(
        { linkType: "custom", url: "https://example.com" },
        { siteUrl: SITE }
      )
    ).toEqual({ kind: "external", href: "https://example.com" });
    expect(
      resolveLexicalLink(
        { linkType: "custom", url: "/kontakt", newTab: true },
        { siteUrl: SITE }
      )
    ).toEqual({ kind: "internal", href: "/kontakt", newTab: true });
  });

  test("autolenke uten linkType behandles som nettadresse", () => {
    expect(
      resolveLexicalLink({ url: "https://example.com" }, { siteUrl: SITE })
    ).toEqual({ kind: "external", href: "https://example.com" });
  });

  test("tomme felt gir null", () => {
    expect(resolveLexicalLink({ linkType: "custom", url: "" })).toBeNull();
    expect(resolveLexicalLink({ linkType: "email", email: "" })).toBeNull();
    expect(resolveLexicalLink(null)).toBeNull();
    expect(lexicalLinkHref({ linkType: "home" })).toBe("/");
  });
});
