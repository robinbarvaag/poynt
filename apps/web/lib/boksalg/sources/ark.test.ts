import { describe, expect, test } from "bun:test";
import { parseArkState, parseJsonLd, toAvailability } from "./ark";
import { retryAfterMs } from "./http";

describe("parseJsonLd", () => {
  test("finner bok-blokka blant flere JSON-LD-skript", () => {
    const html = `
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"ARK"}</script>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":["Product","Book"],"name":"Verdifull vekst","isbn":"9788230375334","offers":{"@type":"Offer","price":399,"availability":"https://schema.org/InStock"}}</script>
    `;
    const parsed = parseJsonLd(html);
    expect(parsed?.isbn).toBe("9788230375334");
    expect(parsed?.offers?.price).toBe(399);
  });

  test("tåler Product alene, @graph og pris som streng", () => {
    const html = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList"},{"@type":"Product","isbn":"123","offers":{"price":"399.00","availability":"https://schema.org/PreOrder"}}]}</script>`;
    const parsed = parseJsonLd(html);
    expect(parsed?.isbn).toBe("123");
    expect(parsed?.offers?.price).toBe("399.00");
  });

  test("gir null uten bok-blokk eller ved ugyldig JSON", () => {
    expect(parseJsonLd("<html></html>")).toBeNull();
    expect(
      parseJsonLd(`<script type="application/ld+json">{not json</script>`)
    ).toBeNull();
  });
});

describe("parseArkState", () => {
  test("leser escapede felt i Next-nyttelasten", () => {
    const html = String.raw`self.__next_f.push([1,"{\"availability\":{\"online\":{\"state\":\"available\"},\"store\":{\"state\":\"unavailable\"}},\"releaseDate\":\"2026-10-15T00:00:00\"}"])`;
    expect(parseArkState(html)).toEqual({
      online: "available",
      store: "unavailable",
      releaseDate: "2026-10-15",
    });
  });

  test("leser også uescapede felt", () => {
    const html =
      '{"availability":{"online":{"state":"preorder"},"store":{"state":"unavailable"}}}';
    expect(parseArkState(html).online).toBe("preorder");
  });

  test("gir null når feltene mangler", () => {
    expect(parseArkState("<html>Access denied</html>")).toEqual({
      online: null,
      store: null,
      releaseDate: null,
    });
  });
});

describe("toAvailability", () => {
  test("ARK-tilstanden vinner over schema.org", () => {
    expect(toAvailability("available", "https://schema.org/PreOrder")).toBe(
      "in_stock"
    );
    expect(toAvailability("unavailable", undefined)).toBe("out_of_stock");
  });

  test("faller tilbake på schema.org, ellers ukjent", () => {
    expect(toAvailability(null, "https://schema.org/InStock")).toBe("in_stock");
    expect(toAvailability(null, undefined)).toBe("unknown");
  });
});

describe("retryAfterMs", () => {
  test("sekunder", () => {
    expect(retryAfterMs("120")).toBe(120_000);
  });

  test("HTTP-dato i framtida", () => {
    const soon = new Date(Date.now() + 5_000).toUTCString();
    const value = retryAfterMs(soon);
    expect(value).not.toBeNull();
    expect(value ?? 0).toBeGreaterThan(3_000);
    expect(value ?? 0).toBeLessThanOrEqual(5_000);
  });

  test("manglende eller uleselig gir null", () => {
    expect(retryAfterMs(null)).toBeNull();
    expect(retryAfterMs("snart")).toBeNull();
  });
});
