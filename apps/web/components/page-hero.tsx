import { getMediaUrl } from "@/lib/media-url";
import { Container, H1, Lead } from "@poynt/ui";
import Image from "next/image";

interface PageHeroProps {
  title: string;
  description?: string;
  image?: {
    url: string;
    alt?: string;
  } | null;
}

export function PageHero({ title, description, image }: PageHeroProps) {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background image with overlay */}
      {image && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={getMediaUrl(image.url)}
            alt={image.alt || ""}
            fill
            className="object-cover opacity-10"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>
      )}

      {/* Decorative background circles */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <H1 className="mb-4">{title}</H1>
          {description && <Lead>{description}</Lead>}
        </div>
      </Container>
    </section>
  );
}
