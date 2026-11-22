import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import * as React from "react";

import { brand } from "../brand";

export { brand };

const fontStack =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif';

const main = { backgroundColor: brand.bg, fontFamily: fontStack, margin: 0 };

const container = {
  margin: "0 auto",
  padding: "32px 0 48px",
  maxWidth: "560px",
};

const card = {
  backgroundColor: brand.card,
  borderRadius: "20px",
  border: `1px solid ${brand.border}`,
  overflow: "hidden",
};

const headerBar = { backgroundColor: brand.primary, padding: "22px 32px" };

const wordmark = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "800",
  letterSpacing: "-0.01em",
  margin: 0,
};

const accentRule = {
  borderColor: brand.saffron,
  borderTopWidth: "3px",
  margin: 0,
};

const content = { padding: "32px" };

const footer = {
  color: brand.muted,
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "24px 0 0",
};

const footerLink = { color: brand.muted, textDecoration: "underline" };

export const emailStyles = {
  heading: {
    color: brand.ink,
    fontSize: "24px",
    fontWeight: "800",
    lineHeight: "1.25",
    margin: "0 0 16px",
  },
  text: {
    color: brand.body,
    fontSize: "16px",
    lineHeight: "26px",
    margin: "0 0 16px",
  },
  eyebrow: {
    color: brand.primary,
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    margin: "0 0 8px",
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: "999px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    textDecoration: "none",
    display: "inline-block",
    padding: "13px 28px",
  },
  label: {
    color: brand.muted,
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    margin: "0 0 2px",
  },
  value: {
    color: brand.ink,
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },
  quote: {
    backgroundColor: brand.panel,
    borderRadius: "14px",
    borderLeft: `3px solid ${brand.primary}`,
    color: brand.body,
    fontSize: "16px",
    lineHeight: "26px",
    padding: "18px 20px",
    margin: "0 0 8px",
    whiteSpace: "pre-wrap" as const,
  },
} as const;

/**
 * Felles, branded e-post-ramme for Poynt: grønn topp med wordmark, saffron
 * aksentstrek, hvitt kort og en dempet footer. Alle Poynt-e-poster bruker denne.
 */
export function EmailShell({
  preview,
  children,
  footerLinks = [],
}: {
  preview: string;
  children: ReactNode;
  /** Ekstra lenker i bunnteksten (kjøpsbetingelser, personvern …). */
  footerLinks?: { label: string; href: string }[];
}) {
  return (
    <Html lang="no">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <Section style={headerBar}>
              <Text style={wordmark}>Poynt</Text>
            </Section>
            <Hr style={accentRule} />
            <Section style={content}>{children}</Section>
          </Section>
          <Text style={footer}>
            Poynt AS ·{" "}
            <Link href="https://www.poynt.no" style={footerLink}>
              poynt.no
            </Link>
            {footerLinks.map((link) => (
              <React.Fragment key={link.href}>
                {" · "}
                <Link href={link.href} style={footerLink}>
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
