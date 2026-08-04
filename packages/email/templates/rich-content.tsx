import * as React from "react";
import { brand } from "./_layout";

/**
 * Richtext-innhold (Lexical → HTML) i Poynt-drakt. E-postklienter kan ikke
 * inline-style vilkårlig HTML, så innholdet stiles via en style-blokk scopet
 * til `.nl`. Delt av nyhetsbrevet og skjema-e-postene, slik at alt admin-skrevet
 * innhold ser likt ut.
 */
const richTextCss = `
  .nl h1, .nl h2 { color: ${brand.ink}; font-size: 22px; font-weight: 800; line-height: 1.3; margin: 24px 0 12px; }
  .nl h3, .nl h4 { color: ${brand.ink}; font-size: 17px; font-weight: 700; line-height: 1.35; margin: 20px 0 8px; }
  .nl p { color: ${brand.body}; font-size: 16px; line-height: 26px; margin: 0 0 16px; }
  .nl a { color: ${brand.primary}; text-decoration: underline; }
  .nl ul, .nl ol { color: ${brand.body}; font-size: 16px; line-height: 26px; margin: 0 0 16px; padding-left: 24px; }
  .nl li { margin-bottom: 6px; }
  .nl blockquote { background-color: ${brand.panel}; border-left: 3px solid ${brand.primary}; border-radius: 14px; color: ${brand.body}; font-size: 16px; line-height: 26px; padding: 18px 20px; margin: 0 0 16px; }
  .nl img { max-width: 100%; height: auto; border-radius: 14px; margin: 0 0 16px; }
  .nl hr { border: none; border-top: 1px solid ${brand.border}; margin: 24px 0; }
  .nl > :first-child { margin-top: 0; }
`;

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
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
