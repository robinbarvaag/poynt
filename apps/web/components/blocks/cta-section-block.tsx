import { ContactLink } from "@/components/contact/contact-link";
import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { Button, Container, GridPattern, Heading, Panel, cn } from "@poynt/ui";
import { DriftingBlob } from "@poynt/ui/motion";
import Link from "next/link";
import type { ReactNode } from "react";

interface CtaSectionBlockProps {
  variant?: "simple" | "colored" | "image";
  title: string;
  description?: string;
  backgroundImage?: MediaResource;
  primaryCta: {
    text: string;
    url: string;
  };
  secondaryCta?: {
    text?: string;
    url?: string;
  };
}

export function CtaSectionBlock({
  variant = "simple",
  title,
  description,
  backgroundImage,
  primaryCta,
  secondaryCta,
}: CtaSectionBlockProps) {
  // På mørke flater (grønn «colored» / bilde) må tekst og knapper snu til lyse
  // toner — ellers blir grønn tekst på grønn bunn (lav kontrast).
  const onDark = variant === "colored" || variant === "image";

  // CTA-er mot /kontakt åpner skjemaet i modal (intercepting) og stemples med
  // kilde; andre URL-er forblir vanlige lenker.
  const ctaLink = (url: string, kilde: string, child: ReactNode) =>
    url.startsWith("/kontakt") ? (
      <ContactLink kilde={kilde}>{child}</ContactLink>
    ) : (
      <Link href={url}>{child}</Link>
    );

  const content = (
    <div className="text-center max-w-2xl mx-auto">
      <Heading
        size="h2"
        color={onDark ? "white" : undefined}
        customStyles="mb-4"
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            "text-lg mb-8",
            onDark ? "text-white/90" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      )}
      <div className="flex gap-4 justify-center flex-wrap">
        {ctaLink(
          primaryCta.url,
          "cta-seksjon",
          // Saffron-knapp popper på grønt og rimer med tall-båndet over.
          <Button size="lg" variant={onDark ? "saffron" : "default"}>
            {primaryCta.text}
          </Button>
        )}
        {secondaryCta?.text &&
          secondaryCta?.url &&
          ctaLink(
            secondaryCta.url,
            "cta-seksjon-sekundaer",
            <Button
              size="lg"
              variant="outline"
              className={cn(
                // outline har bg-background (hvit) + Mimi hover — må nøytraliseres
                // på mørk flate, ellers blir det hvit tekst på hvit knapp.
                onDark &&
                  "border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
              )}
            >
              {secondaryCta.text}
            </Button>
          )}
      </div>
    </div>
  );

  // Innholds-only: BlockSection eier <section>/spacing; her rendres kun
  // Container (felles maks-bredde med resten av siden) + innholdet.
  if (variant === "image" && backgroundImage) {
    // Bilde-CTA som avrundet panel i samme geometri som de andre panelene —
    // ikke fullbredde, så breddelinjen på siden holdes ubrutt.
    return (
      <Container padding="none">
        <div className="relative overflow-hidden rounded-3xl px-6 py-16 text-white shadow-lg md:px-12 md:py-20">
          <div className="absolute inset-0">
            <PayloadImage
              media={backgroundImage}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="relative z-10">{content}</div>
        </div>
      </Container>
    );
  }

  if (variant === "colored") {
    // Avrundet grønt PANEL som flyter på sidens jevne bakgrunn (ingen
    // fullbredde-søm). Blober/dot-tekstur klippes pent av panelets runding.
    return (
      <Container padding="none">
        <Panel surface="primary">
          {/* Signaturflørt: organiske former bak innholdet — kun her, jf. docs/COMPOSITION.md §3 */}
          <GridPattern
            variant="dots"
            fade
            className="text-primary-foreground/15"
          />
          <DriftingBlob className="-left-16 -top-12 size-80 bg-accent-3/15" />
          <DriftingBlob
            className="-bottom-20 -right-12 size-96 bg-accent-1/10"
            duration={24}
          />
          <div className="relative z-10">{content}</div>
        </Panel>
      </Container>
    );
  }

  // «simple»: ingen egen fargeflate — hviler rolig på sidens bakgrunn (unngår
  // enda en grå boks i seksjonsrytmen).
  return <Container padding="none">{content}</Container>;
}
