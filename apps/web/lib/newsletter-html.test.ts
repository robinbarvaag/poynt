import { describe, expect, test } from "bun:test";
import {
  EMAIL_CONTENT_WIDTH,
  inlineRichTextStyles,
} from "@poynt/email/rich-text-styles";
import { emailImageHtml, pickEmailImage } from "./newsletter-html";

/** Et mobilbilde slik Payload lagrer det: diger original + genererte størrelser. */
const phonePhoto = {
  url: "/api/media/file/bok.jpg",
  width: 4032,
  height: 3024,
  alt: "Boka Verdifull vekst",
  sizes: {
    large: {
      url: "/api/media/file/bok-2400x1800.webp",
      width: 2400,
      height: 1800,
    },
    tablet: {
      url: "/api/media/file/bok-1024x768.jpg",
      width: 1024,
      height: 768,
    },
  },
};

describe("pickEmailImage", () => {
  test("bruker tablet-størrelsen, aldri den digre originalen", () => {
    expect(pickEmailImage(phonePhoto)?.url).toBe(
      "/api/media/file/bok-1024x768.jpg"
    );
  });

  test("små originaler sendes som de er", () => {
    const logo = { url: "/api/media/file/logo.png", width: 300, height: 100 };
    expect(pickEmailImage(logo)?.url).toBe("/api/media/file/logo.png");
  });

  test("stor original uten tablet faller tilbake til large", () => {
    const media = { ...phonePhoto, sizes: { large: phonePhoto.sizes.large } };
    expect(pickEmailImage(media)?.url).toBe(
      "/api/media/file/bok-2400x1800.webp"
    );
  });

  test("uten noen størrelser: originalen", () => {
    const media = { url: "/api/media/file/bok.jpg", width: 4032, height: 3024 };
    expect(pickEmailImage(media)?.url).toBe("/api/media/file/bok.jpg");
  });
});

describe("emailImageHtml", () => {
  test("låser bildet til innholdsbredden, med riktig høyde", () => {
    const html = emailImageHtml(phonePhoto);
    expect(html).toContain(`width="${EMAIL_CONTENT_WIDTH}"`);
    expect(html).toContain(
      `height="${Math.round(EMAIL_CONTENT_WIDTH * 0.75)}"`
    );
    expect(html).toContain(`max-width:${EMAIL_CONTENT_WIDTH}px`);
    expect(html).toContain("height:auto");
    expect(html).not.toContain("4032");
    expect(html).not.toContain("<picture");
  });

  test("blåser ikke opp små bilder", () => {
    const html = emailImageHtml({
      url: "/api/media/file/logo.png",
      width: 300,
      height: 100,
    });
    expect(html).toContain('width="300"');
    expect(html).toContain('height="100"');
    expect(html).toContain("max-width:300px");
  });

  test("stripper verten fra app-servert media og escaper alt-teksten", () => {
    const html = emailImageHtml(
      {
        url: "http://localhost:3000/api/media/file/a.jpg",
        width: 800,
        height: 600,
      },
      'Susanne sier "hei"'
    );
    expect(html).toContain('src="/api/media/file/a.jpg"');
    expect(html).toContain("Susanne sier &quot;hei&quot;");
  });

  test("tomt når mediet mangler url", () => {
    expect(emailImageHtml({})).toBe("");
  });
});

describe("inlineRichTextStyles", () => {
  test("legger stiler rett på taggene", () => {
    const html = inlineRichTextStyles(
      '<p>Hei</p><p>Les <a href="/om">mer</a></p>'
    );
    expect(html).toMatch(/^<p style="[^"]*font-size:16px;[^"]*">Hei<\/p>/);
    expect(html).toMatch(
      /<a style="[^"]*text-decoration:underline;" href="\/om">/
    );
  });

  test("første element får ingen luft over seg", () => {
    const html = inlineRichTextStyles("<h2>Tittel</h2><h2>Neste</h2>");
    const [first, second] = html.split("</h2>");
    expect(first).toContain("margin-top:0;");
    expect(second).not.toContain("margin-top:0;");
  });

  test("beholder stiler som alt står der — de vinner over våre", () => {
    const html = inlineRichTextStyles(
      '<p style="text-align: center;">Midtstilt</p>'
    );
    expect(html).toMatch(
      /<p style="[^"]*font-size:16px;[^"]*text-align: center;">/
    );
    expect(html.match(/style=/g)).toHaveLength(1);
  });

  test("bilder krymper til rammen, og selvlukkende tagger holder seg gyldige", () => {
    const html = inlineRichTextStyles(
      '<p>x</p><img src="a.jpg" width="4032" /><hr />'
    );
    expect(html).toMatch(
      /<img style="max-width:100%;height:auto;[^"]*" src="a.jpg" width="4032" \/>/
    );
    expect(html).toMatch(/<hr style="[^"]*" \/>/);
  });

  test("rører ikke tagger som bare begynner likt", () => {
    const html = "<picture><pre>kode</pre></picture><article>x</article>";
    expect(inlineRichTextStyles(html)).toBe(html);
  });
});
