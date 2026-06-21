"use client";

import { Dialog, DialogContent, DialogTitle } from "@poynt/ui";
import { useRouter } from "next/navigation";
import type { Form as PayloadForm } from "../../payload-types";
import { FormBlockComponent } from "../blocks/form-block";

interface ContactModalProps {
  form: PayloadForm;
  /** Forhåndsvalgt emne (fra ?emne=) — styrer kontekstuell overskrift. */
  subject?: string;
}

/**
 * Kontaktskjemaet vist som sentrert dialog. Renders kun via
 * @modal/(.)kontakt-interceptoren ved klient-navigasjon. Lukking
 * (Esc, X eller klikk utenfor) går ett steg tilbake i historikken, så
 * brukeren havner tilbake på siden modalet ble åpnet fra.
 */
export function ContactModal({ form, subject }: ContactModalProps) {
  const router = useRouter();

  const heading = subject ? `Snakk med oss om ${subject}` : "Send en melding";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto p-6 sm:rounded-2xl md:p-8">
        {/* Synlig overskrift kommer fra FormBlock — denne er for skjermlesere. */}
        <DialogTitle className="sr-only">{heading}</DialogTitle>
        <FormBlockComponent
          form={form}
          title={heading}
          description="Fyll ut skjemaet, så hører du fra meg – vanligvis innen et par dager."
          variant="default"
          maxWidth="full"
          bare
        />
      </DialogContent>
    </Dialog>
  );
}
