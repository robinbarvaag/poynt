import { CtaSectionBlock } from "@/components/blocks/cta-section-block";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { RichText } from "@/components/rich-text";
import { ServiceCard } from "@/components/service-card";
import { resolveMedia } from "@/lib/payload";
import { formatServicePrice, withContactSource } from "@/lib/service";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { Service, Servicespage } from "@/payload-types";
import {
  Breadcrumbs,
  Button,
  Container,
  Faq,
  Heading,
  SectionHeader,
  Text,
} from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

interface ServiceViewProps {
  service: Service;
  cta?: Servicespage["detailCta"] | null;
  /** Andre aktive tjenester — vises som «Andre tjenester» nederst. */
  related?: Service[];
}

/**
 * Selve tjenestesiden — delt mellom den statiske /tjenester/[slug] og
 * /forhandsvisning/tjenester/[slug] (utkast), slik at redaktøren ser nøyaktig
 * det som publiseres.
 *
 * Toppen er delt: tekst + handling til venstre, bildet stående til høyre
 * (4:5). Et stående utsnitt kler portretter langt bedre enn et bredt
 * 16:9-banner, og bildet konkurrerer ikke med overskriften. Fokuspunktet
 * redaktøren setter på bildet (Media → dra prikken) styrer utsnittet her, i
 * kortene og i modalet — ett punkt dekker alle formatene.
 */
export function ServiceView({ service, cta, related = [] }: ServiceViewProps) {
  const image = resolveMedia(service.image);
  const faq = (service.faq ?? []).filter((f) => f.question && f.answer);
  const ctaText = cta?.primaryCta?.text || service.ctaText || "Ta kontakt";
  const ctaHref = withContactSource(
    service.ctaLink || cta?.primaryCta?.url || "/kontakt",
    service.name,
    `/tjenester/${service.slug}`
  );

  return (
    <>
      <Container padding="default">
        <Breadcrumbs
          items={detailBreadcrumbs("tjenester", service.name)}
          className="mb-8"
        />
        <header
          className={
            image?.url
              ? "grid items-center gap-8 md:grid-cols-[3fr_2fr] md:gap-12"
              : "max-w-3xl"
          }
        >
          <div>
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
            <Text variant="lead" customStyles="whitespace-pre-line">
              {service.shortDescription}
            </Text>
            <Button asChild size="lg" className="mt-8 gap-2">
              <Link href={ctaHref}>
                {ctaText}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {image?.url && (
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-muted md:aspect-4/5">
              <PayloadImage
                media={image}
                alt={image.alt || service.name}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
                loading="eager"
                fetchPriority="high"
              />
              <MediaCredit media={image} />
            </div>
          )}
        </header>
      </Container>

      {(service.content || faq.length > 0) && (
        <Container size="sm" padding="default">
          <article>
            {service.content && (
              <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
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
      )}

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

      {related.length > 0 && (
        <Container padding="lg">
          <SectionHeader
            title="Andre tjenester"
            intro="Kanskje passer en av disse bedre?"
            reveal={false}
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <ServiceCard
                key={s.id}
                service={
                  s as unknown as ComponentProps<typeof ServiceCard>["service"]
                }
              />
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
