import { CtaSectionBlock } from "@/components/blocks/cta-section-block";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { RichText } from "@/components/rich-text";
import { resolveMedia } from "@/lib/payload";
import { formatServicePrice } from "@/lib/service";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { Service, Servicespage } from "@/payload-types";
import { Breadcrumbs, Container, Faq, Heading, Text } from "@poynt/ui";

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
  const faq = (service.faq ?? []).filter((f) => f.question && f.answer);

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
                loading="eager"
                fetchPriority="high"
              />
              <MediaCredit media={image} />
            </div>
          )}

          {service.content && (
            <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground mb-10">
              <RichText data={service.content} />
            </div>
          )}

          {/* FAQ-en fra SEO-fanen vises synlig — FAQPage-JSON-LD-en som
              sendes for siden skal speile innhold folk faktisk kan lese. */}
          {faq.length > 0 && (
            <section className="mt-14">
              <Heading variant="h2" customStyles="mb-6">
                Det folk lurer på
              </Heading>
              <Faq bare items={faq} />
            </section>
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
