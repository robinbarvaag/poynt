import { describe, expect, test } from "bun:test";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { buildNewsletterHtml } from "./newsletter-html";

const text = (value: string) => ({
  type: "text",
  text: value,
  format: 0,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
});

const paragraph = (children: unknown[]) => ({
  type: "paragraph",
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  textFormat: 0,
  version: 1,
});

const link = (fields: Record<string, unknown>, label: string) => ({
  type: "link",
  fields,
  children: [text(label)],
  direction: "ltr",
  format: "",
  indent: 0,
  version: 3,
});

/** Et nyhetsbrev slik det hentes med `depth` — bildet og siden er fylt ut. */
const content = {
  root: {
    type: "root",
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
    children: [
      paragraph([text("Hei!")]),
      {
        type: "upload",
        relationTo: "media",
        fields: null,
        format: "",
        version: 3,
        value: {
          id: 1,
          url: "/api/media/file/bok.jpg",
          mimeType: "image/jpeg",
          filename: "bok.jpg",
          width: 4032,
          height: 3024,
          alt: "Boka",
          sizes: {
            tablet: {
              url: "/api/media/file/bok-1024x768.jpg",
              width: 1024,
              height: 768,
              mimeType: "image/jpeg",
              filesize: 1,
              filename: "bok-1024x768.jpg",
            },
          },
        },
      },
      paragraph([
        link({ linkType: "custom", url: "https://norli.no/bok" }, "Norli"),
        link({ linkType: "email", email: "hei@poynt.no" }, "Skriv til oss"),
        link({ linkType: "home" }, "Forsiden"),
        link(
          {
            linkType: "internal",
            doc: { relationTo: "pages", value: { id: 2, slug: "om" } },
          },
          "Om oss"
        ),
        link(
          { linkType: "internal", doc: { relationTo: "pages", value: 99 } },
          "Slettet side"
        ),
      ]),
    ],
  },
} as unknown as SerializedEditorState;

// Samme oppslag som newsletter-html.ts — testen skal tåle at .env setter den.
const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

describe("buildNewsletterHtml", () => {
  test("hele nyhetsbrevet: bilde i rammebredde, alle lenketyper virker", async () => {
    const html = await buildNewsletterHtml({
      content,
      preview: "Test",
      unsubscribeUrl: "https://eksempel.no/avmeld",
    });

    // Bildet: tablet-fila, absolutt URL, låst bredde — ingen spor av originalen.
    expect(html).toContain(`src="${siteUrl}/api/media/file/bok-1024x768.jpg"`);
    expect(html).toContain('width="494"');
    expect(html).toContain("max-width:494px");
    expect(html).not.toContain("4032");
    expect(html).not.toContain("<picture");

    // Stilene står på taggene, ikke bare i style-blokken.
    expect(html).toMatch(/<p style="[^"]*font-size:16px/);

    expect(html).toContain('href="https://norli.no/bok"');
    expect(html).toContain('href="mailto:hei@poynt.no"');
    // Lenker til eget nettsted UTM-merkes (besøk per nyhetsbrev, ikke per person).
    expect(html).toContain(
      `href="${siteUrl}/?utm_source=nyhetsbrev&amp;utm_medium=e-post&amp;utm_campaign=forside&amp;utm_content=`
    );
    expect(html).toContain(
      `href="${siteUrl}/om?utm_source=nyhetsbrev&amp;utm_medium=e-post&amp;utm_campaign=om&amp;utm_content=`
    );
    // Uløselig intern lenke blir ren tekst, ikke en død lenke.
    expect(html).toContain("Slettet side");
    expect(html).not.toContain('href="#"');
  });
});
