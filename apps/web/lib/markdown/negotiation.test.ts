import { describe, expect, test } from "bun:test";
import {
  isNonPagePath,
  markdownPathFor,
  markdownRewritePath,
  markdownUrlFor,
  prefersMarkdown,
} from "./negotiation";

describe("prefersMarkdown", () => {
  test("nettlesere får HTML", () => {
    expect(
      prefersMarkdown(
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      )
    ).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
    expect(prefersMarkdown(null)).toBe(false);
  });

  test("eksplisitt markdown vinner, også ved lik prioritet", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, text/html")).toBe(true);
    expect(prefersMarkdown("text/html;q=0.5, text/markdown;q=0.9")).toBe(true);
  });

  test("markdown med lavere prioritet enn HTML gir HTML", () => {
    expect(prefersMarkdown("text/html, text/markdown;q=0.5")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0")).toBe(false);
  });
});

describe("markdownPathFor", () => {
  test(".md-suffiks", () => {
    expect(markdownPathFor({ pathname: "/tjenester/radgiving.md" })).toBe(
      "/tjenester/radgiving"
    );
    expect(markdownPathFor({ pathname: "/index.md" })).toBe("/");
  });

  test("?format=md og Accept-header", () => {
    expect(markdownPathFor({ pathname: "/blogg", format: "md" })).toBe(
      "/blogg"
    );
    expect(markdownPathFor({ pathname: "/", accept: "text/markdown" })).toBe(
      "/"
    );
    expect(markdownPathFor({ pathname: "/blogg/", format: "md" })).toBe(
      "/blogg"
    );
  });

  test("vanlige forespørsler rewrites ikke", () => {
    expect(markdownPathFor({ pathname: "/blogg" })).toBeNull();
    expect(
      markdownPathFor({ pathname: "/blogg", accept: "text/html" })
    ).toBeNull();
  });

  test("private og tekniske områder har ingen markdown", () => {
    expect(markdownPathFor({ pathname: "/on-poynt/kurs/x.md" })).toBeNull();
    expect(markdownPathFor({ pathname: "/admin", format: "md" })).toBeNull();
    expect(markdownPathFor({ pathname: "/handlekurv.md" })).toBeNull();
    expect(markdownPathFor({ pathname: "/api/md.md" })).toBeNull();
  });

  test("filer forhandles ikke, selv om klienten ber om markdown", () => {
    for (const pathname of [
      "/llms.txt",
      "/llms-full.txt",
      "/robots.txt",
      "/sitemap.xml",
      "/favicon.ico",
      "/icon.png",
      "/apple-icon.png",
      "/manifest.webmanifest",
      "/block-previews/hero.png",
      "/push-sw.js",
    ]) {
      expect(markdownPathFor({ pathname, accept: "text/markdown" })).toBeNull();
      expect(markdownPathFor({ pathname, format: "md" })).toBeNull();
    }
  });

  test("Nexts metadata-ruter uten filendelse forhandles ikke", () => {
    for (const pathname of [
      "/opengraph-image",
      "/twitter-image",
      "/icon",
      "/apple-icon",
      "/blogg/et-innlegg/opengraph-image",
      "/opengraph-image-1ow20b",
      "/icon/liten",
    ]) {
      expect(markdownPathFor({ pathname, accept: "text/markdown" })).toBeNull();
      expect(markdownPathFor({ pathname, format: "md" })).toBeNull();
    }
  });

  test("sider som bare ligner på filer eller metadata-ruter forhandles", () => {
    expect(
      markdownPathFor({ pathname: "/blogg/ikoner", accept: "text/markdown" })
    ).toBe("/blogg/ikoner");
    expect(
      markdownPathFor({ pathname: "/blogg/icon-bibliotek", format: "md" })
    ).toBe("/blogg/icon-bibliotek");
    expect(
      markdownPathFor({ pathname: "/blogg/manifest", accept: "text/markdown" })
    ).toBe("/blogg/manifest");
    expect(
      markdownPathFor({ pathname: "/tjenester/radgiving/", format: "md" })
    ).toBe("/tjenester/radgiving");
  });

  test(".md-suffikset virker uavhengig av Accept-headeren", () => {
    expect(
      markdownPathFor({
        pathname: "/tjenester/radgiving.md",
        accept: "text/markdown",
      })
    ).toBe("/tjenester/radgiving");
    expect(markdownPathFor({ pathname: "/index.md", format: "md" })).toBe("/");
  });

  test("den offentlige /on-poynt-salgssiden har markdown", () => {
    expect(markdownPathFor({ pathname: "/on-poynt.md" })).toBe("/on-poynt");
  });
});

describe("isNonPagePath", () => {
  test("skiller filer og metadata-ruter fra sider", () => {
    expect(isNonPagePath("/llms.txt")).toBe(true);
    expect(isNonPagePath("/opengraph-image")).toBe(true);
    expect(isNonPagePath("/")).toBe(false);
    expect(isNonPagePath("/blogg")).toBe(false);
    expect(isNonPagePath("/blogg/et-innlegg")).toBe(false);
  });
});

describe("url-hjelpere", () => {
  test("rewrite-sti og offentlig .md-adresse", () => {
    expect(markdownRewritePath("/")).toBe("/api/md");
    expect(markdownRewritePath("/blogg/x")).toBe("/api/md/blogg/x");
    expect(markdownUrlFor("https://poynt.no", "/")).toBe(
      "https://poynt.no/index.md"
    );
    expect(markdownUrlFor("https://poynt.no", "/kontakt")).toBe(
      "https://poynt.no/kontakt.md"
    );
  });
});
