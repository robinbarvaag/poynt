import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, brand } from "./_layout";
import { RichContent } from "./rich-content";

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
      <RichContent html={contentHtml} />{" "}
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
