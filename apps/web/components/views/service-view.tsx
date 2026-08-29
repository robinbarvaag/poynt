import { CtaSectionBlock } from "@/components/blocks/cta-section-block";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { resolveMedia } from "@/lib/payload";
import { formatServicePrice } from "@/lib/service";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { Service, Servicespage } from "@/payload-types";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Breadcrumbs, Container, Heading, Text } from "@poynt/ui";

interface ServiceViewProps {
  service: Service;
  cta?: Servicespage["detailCta"] | null;
}

/**
 * Selve tjenestesiden — delt mellom den statiske /tjenester/[slug] og
 * /forhandsvisning/tjenester/[slug] (utkast), slik at redaktøren ser nøyaktig
 * det som publiseres.
 */
export function ServiceView({ service, cta }: ServiceViewProps) {
  const image = resolveMedia(service.image);

  return (
    <>
      <Container size="sm" padding="default">
        <article>
          <Breadcrumbs
            items={detailBreadcrumbs("tjenester", service.name)}
            className="mb-8"
          />

          <header className="mb-8">
            <Heading variant="h1" color="foreground" weight="bold">
              {service.name}
            </Heading>
            <Text
              type="p"
              color="primary"
              weight="semibold"
              customStyles="mb-4 text-2xl"
            >
              {formatServicePrice(service)}
            </Text>
            {/* pre-line: respekter linjeskift redaktøren har lagt inn */}
            <Text variant={"lead"} customStyles="whitespace-pre-line">
              {service.shortDescription}
            </Text>
          </header>

          {image?.url && (
            <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-3xl bg-muted">
              <PayloadImage
                media={image}
                alt={image.alt || service.name}
                fill
                className="object-cover"
                priority
              />
              <MediaCredit media={image} />
            </div>
          )}

          {service.content && (
            <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground mb-10">
              <RichText data={service.content} />
            </div>
          )}
        </article>
      </Container>

      {/* Felles CTA, styrt fra Tjenesteoversikt-globalen */}
      {cta && (
        <CtaSectionBlock
          variant={cta.variant ?? "colored"}
          title={cta.title || "Interessert?"}
          description={cta.description ?? undefined}
          primaryCta={{
            text: cta.primaryCta?.text || "Ta kontakt",
            url: cta.primaryCta?.url || "/kontakt",
          }}
        />
      )}
    </>
  );
}
