import * as React from "react";
import { EmailShell } from "./_layout";
import { RichContent } from "./rich-content";

interface FormEmailProps {
  /** Forhåndsvisningstekst i innboksen — typisk emnefeltet. */
  preview: string;
  /** Ferdig HTML fra skjemaets e-postmelding (Lexical → HTML). */
  contentHtml: string;
}

/**
 * Ramma rundt e-poster som partneren setter opp selv under Skjemaer →
 * «E-poster ved innsending» (form-builder-pluginen). Innholdet skrives i
 * admin; her legges bare Poynt-drakta på, samme som nyhetsbrevet.
 */
export default function FormEmail({ preview, contentHtml }: FormEmailProps) {
  return (
    <EmailShell preview={preview}>
      <RichContent html={contentHtml} />
    </EmailShell>
  );
}
