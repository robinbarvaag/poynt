import { brand } from "./brand";

/**
 * Bredden på innholdsfeltet i Poynt-ramma (EmailShell): 560 px kort minus
 * 1 px kant og 32 px luft på hver side. Bilder i e-post får denne som
 * `width`-attributt — Outlook (Word-motoren) ser bort fra `max-width` og
 * tegner ellers bildet i full pikselstørrelse.
 */
export const EMAIL_CONTENT_WIDTH = 494;

const heading = `color:${brand.ink};font-size:22px;font-weight:800;line-height:1.3;margin:24px 0 12px;`;
const subheading = `color:${brand.ink};font-size:17px;font-weight:700;line-height:1.35;margin:20px 0 8px;`;
const list = `color:${brand.body};font-size:16px;line-height:26px;margin:0 0 16px;padding-left:24px;`;

/**
 * Stilene for admin-skrevet richtext (Lexical → HTML), per tagg. Én kilde for
 * både style-blokken i RichContent og inline-stilene under.
 */
export const RICH_TEXT_STYLES: Record<string, string> = {
  h1: heading,
  h2: heading,
  h3: subheading,
  h4: subheading,
  p: `color:${brand.body};font-size:16px;line-height:26px;margin:0 0 16px;`,
  a: `color:${brand.primary};text-decoration:underline;`,
  ul: list,
  ol: list,
  li: "margin-bottom:6px;",
  blockquote: `background-color:${brand.panel};border-left:3px solid ${brand.primary};border-radius:14px;color:${brand.body};font-size:16px;line-height:26px;padding:18px 20px;margin:0 0 16px;`,
  img: "max-width:100%;height:auto;border-radius:14px;margin:0 0 16px;",
  hr: `border:none;border-top:1px solid ${brand.border};margin:24px 0;`,
};

const TAG_PATTERN = new RegExp(
  `<(${Object.keys(RICH_TEXT_STYLES).join("|")})(?=[\\s/>])([^>]*)>`,
  "gi"
);
const STYLE_ATTRIBUTE = /\sstyle\s*=\s*"([^"]*)"/i;

/**
 * Legg stilene rett på taggene (`style="…"`). Flere e-postklienter kaster
 * `<style>`-blokker som ikke står i `<head>` (bl.a. Gmail), og da ble
 * richtext-innholdet stående ustilet — bilder i full pikselbredde sprengte
 * hele e-posten. Inline-stiler virker overalt.
 *
 * Stiler som alt står på taggen (f.eks. `text-align` fra editoren, eller
 * bildebredden fra nyhetsbrev-konverteren) beholdes og vinner over våre.
 */
export function inlineRichTextStyles(html: string): string {
  let first = true;
  return html.replace(TAG_PATTERN, (_match, tag: string, attrs: string) => {
    const base = RICH_TEXT_STYLES[tag.toLowerCase()] ?? "";
    // Første element skal ikke ha luft over seg (tilsvarer `:first-child`).
    const css = first ? `${base}margin-top:0;` : base;
    first = false;
    if (STYLE_ATTRIBUTE.test(attrs)) {
      const merged = attrs.replace(
        STYLE_ATTRIBUTE,
        (_style, existing: string) => ` style="${css}${existing}"`
      );
      return `<${tag}${merged}>`;
    }
    return `<${tag} style="${css}"${attrs}>`;
  });
}
