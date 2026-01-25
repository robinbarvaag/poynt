import { getMediaUrl } from "@/lib/media-url";
import { Container, H1, Lead, cn } from "@poynt/ui";
import Image from "next/image";

interface PageHeroProps {
  title: string;
  description?: string;
  image?: {
    url: string;
    alt?: string;
  } | null;
  children?: React.ReactNode;
  size?: "default" | "large";
}

export function PageHero({ title, description, image, children, size = "default" }: PageHeroProps) {
  return (
    <section className={cn(
      "relative overflow-hidden",
      size === "large" ? "py-12 md:py-20" : "py-8 md:py-12"
    )}>
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

      {/* Animated decorative elements - larger and more visible */}
      <div className="absolute top-10 right-[12%] w-24 h-24 bg-accent/30 rounded-full -z-10 blur-xl animate-float-slow" />
      <div className="absolute top-20 left-[8%] w-32 h-32 bg-primary/20 rounded-full -z-10 blur-2xl animate-float-medium" />
      <div className="absolute bottom-10 right-[18%] w-20 h-20 bg-accent/25 rounded-full -z-10 blur-lg animate-float-fast" />
      <div className="absolute bottom-16 left-[20%] w-16 h-16 bg-primary/15 rounded-full -z-10 blur-xl animate-float-slow" />

      {/* Smaller accent dots for detail */}
      <div className="absolute top-1/3 right-[25%] w-3 h-3 bg-accent/50 rounded-full -z-10 animate-float-medium" />
      <div className="absolute bottom-1/3 left-[15%] w-2 h-2 bg-primary/40 rounded-full -z-10 animate-float-fast" />

      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <H1 className="mb-4">{title}</H1>
          {description && <Lead className="mb-6">{description}</Lead>}
          {children}
        </div>
      </Container>
    </section>
  );
}
