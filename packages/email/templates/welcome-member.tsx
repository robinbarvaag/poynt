import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeMemberEmailProps {
  memberName: string;
  tier: "Community" | "Community + AI";
  onboardingUrl: string;
}

export default function WelcomeMemberEmail({
  memberName,
  tier,
  onboardingUrl,
}: WelcomeMemberEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Velkommen til On Poynt - din markedsføringsplanlegger</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Velkommen til On Poynt!</Heading>
          <Text style={text}>Hei {memberName},</Text>
          <Text style={text}>
            Takk for at du ble {tier}-medlem! Du har nå tilgang til
            On Poynt-plattformen med verktøy for markedsføringsplanlegging.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={onboardingUrl}>
              Kom i gang
            </Button>
          </Section>
          <Text style={footer}>
            Hvis du har spørsmål, svar på denne e-posten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginBottom: "64px",
  marginTop: "32px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#1e293b",
  margin: "0 0 24px",
};

const text = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 16px",
};

const buttonContainer = {
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#64748b",
  margin: "32px 0 0",
};
