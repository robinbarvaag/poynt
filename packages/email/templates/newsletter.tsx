import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, brand } from "./_layout";

interface NewsletterEmailProps {
  preview: string;
  /**
   * Ferdig HTML fra Payload-richtext (Lexical → HTML). Stiles via
   * style-blokken under siden vi ikke kan inline-style vilkårlig innhold.
   */
  contentHtml: string;
  /**
   * Avmeldingslenke. For broadcasts settes denne til Resend-plassholderen
   * `{{{RESEND_UNSUBSCRIBE_URL}}}` som Resend bytter ut per mottaker.
   */
  unsubscribeUrl: string;
}

/**
 * Nyhetsbrev-mal i Poynt-drakt (samme EmailShell som ordre-/kontakt-e-postene).
 * Innholdet skrives i Payload (Nyhetsbrev-collection) og renderes her.
 */
export default function NewsletterEmail({
  preview,
  contentHtml,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <EmailShell preview={preview}>
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: e-postklienter trenger en style-blokk for richtext-innholdet
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />
      <div
        className="nl"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: innholdet kommer fra Payload-admin (kun partner har tilgang)
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />{" "}
      <Section style={{ marginTop: "32px" }}>
        <Text
          style={{
            color: brand.muted,
            fontSize: "12px",
            lineHeight: "18px",
            margin: 0,
          }}
        >
          Du mottar denne e-posten fordi du har meldt deg på nyhetsbrevet fra
          Poynt.{" "}
          <Link
            href={unsubscribeUrl}
            style={{ color: brand.muted, textDecoration: "underline" }}
          >
            Meld deg av
          </Link>
        </Text>
      </Section>
    </EmailShell>
  );
}
