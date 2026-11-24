import * as React from "react";
import { RICH_TEXT_STYLES, inlineRichTextStyles } from "../rich-text-styles";

/**
 * Richtext-innhold (Lexical → HTML) i Poynt-drakt. Delt av nyhetsbrevet og
 * skjema-e-postene, slik at alt admin-skrevet innhold ser likt ut.
 *
 * Stilene legges rett på taggene (`inlineRichTextStyles`) — det er det eneste
 * som virker i alle e-postklienter. Style-blokken scopet til `.nl` er bare en
 * reserve for tagger skrevet på en måte inlineren ikke kjenner igjen; Gmail
 * m.fl. kaster den fordi den ikke står i `<head>`.
 */
const richTextCss = `${Object.entries(RICH_TEXT_STYLES)
  .map(([tag, css]) => `.nl ${tag} { ${css} }`)
  .join("\n")}
.nl > :first-child { margin-top: 0; }`;

export function RichContent({ html }: { html: string }) {
  return (
    <>
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: e-postklienter trenger en style-blokk for richtext-innholdet
        dangerouslySetInnerHTML={{ __html: richTextCss }}
      />
      <div
        className="nl"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: innholdet kommer fra Payload-admin (kun partner har tilgang)
        dangerouslySetInnerHTML={{ __html: inlineRichTextStyles(html) }}
      />
    </>
  );
}
