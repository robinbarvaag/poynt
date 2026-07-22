"use client";

import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { ShowcaseModal } from "@poynt/ui";
import { useRouter } from "next/navigation";
import type { Form as PayloadForm } from "../../payload-types";
import { FormBlockComponent } from "../blocks/form-block";

interface ContactModalProps {
  form: PayloadForm;
  /** Forhåndsvalgt emne (fra ?emne=) — styrer kontekstuell overskrift. */
  subject?: string;
  /** Rene media-data (serialiserbart) — hero-bildet fra kontakt-siden. */
  image?: MediaResource;
}

/**
 * Kontaktskjemaet i det felles `ShowcaseModal`-skallet (samme som
 * tjenestemodalet): bilde øverst, eyebrow + heading i samme typografi og rund
 * lukkeknapp. Renders kun via @modal/(.)kontakt-interceptoren ved
 * klient-navigasjon; lukking animerer ut og går ett steg tilbake i
 * historikken, så brukeren havner på siden modalet ble åpnet fra.
 */
export function ContactModal({ form, subject, image }: ContactModalProps) {
  const router = useRouter();

  const heading = subject ? `Snakk med oss om ${subject}` : "Send en melding";

  return (
    <ShowcaseModal
      onClosed={() => router.back()}
      ariaLabel={heading}
      imageClassName="aspect-[21/9]"
      image={
        image?.url ? (
          <PayloadImage
            media={image}
            alt={image.alt || ""}
            fill
            className="object-cover"
          />
        ) : undefined
      }
    >
      <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]">
        Kontakt
      </span>
      <h2 className="mt-2 font-bold font-heading text-3xl leading-tight tracking-tight md:text-4xl">
        {heading}
      </h2>
      <p className="mt-5 text-base text-muted-foreground leading-relaxed">
        Fyll ut skjemaet, så hører du fra meg – vanligvis innen et par dager.
      </p>
      <div className="mt-7">
        <FormBlockComponent
          form={form}
          variant="default"
          maxWidth="full"
          bare
          hideHeader
        />
      </div>
    </ShowcaseModal>
  );
}
