import { Button } from "@poynt/ui";
import { cn } from "@poynt/ui";
import Image from "next/image";
import Link from "next/link";

interface HeroBlockProps {
  variant?: "centered" | "left" | "split" | "fullscreen";
  title: string;
  subtitle?: string;
  image?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  primaryCta?: {
    text?: string;
    url?: string;
  };
  secondaryCta?: {
    text?: string;
    url?: string;
  };
  // Bakoverkompatibilitet
  cta?: {
    text?: string;
    url?: string;
  };
}

export function HeroBlock({
  variant = "centered",
  title,
  subtitle,
  image,
  primaryCta,
  secondaryCta,
  cta,
}: HeroBlockProps) {
  // Støtt gammel cta-struktur
  const mainCta = primaryCta?.text ? primaryCta : cta;

  if (variant === "fullscreen") {
    return (
      <section className="relative min-h-[80vh] flex items-center justify-center">
        {image && (
          <div className="absolute inset-0 -z-10">
            <Image
              src={image.url}
              alt={image.alt || ""}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}
        <div className="relative text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">{title}</h1>
          {subtitle && (
            <p className="text-xl md:text-2xl mb-8 opacity-90">{subtitle}</p>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            {mainCta?.text && mainCta?.url && (
              <Link href={mainCta.url}>
                <Button size="lg">{mainCta.text}</Button>
              </Link>
            )}
            {secondaryCta?.text && secondaryCta?.url && (
              <Link href={secondaryCta.url}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  {secondaryCta.text}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "split") {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{title}</h1>
              {subtitle && (
                <p className="text-xl text-muted-foreground mb-8">{subtitle}</p>
              )}
              <div className="flex gap-4 flex-wrap">
                {mainCta?.text && mainCta?.url && (
                  <Link href={mainCta.url}>
                    <Button size="lg">{mainCta.text}</Button>
                  </Link>
                )}
                {secondaryCta?.text && secondaryCta?.url && (
                  <Link href={secondaryCta.url}>
                    <Button size="lg" variant="outline">
                      {secondaryCta.text}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            {image && (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src={image.url}
                  alt={image.alt || ""}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Centered (default) og left variants
  return (
    <section className="relative py-20 md:py-32 px-4">
      {image && variant === "centered" && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={image.url}
            alt={image.alt || ""}
            fill
            className="object-cover opacity-10"
          />
        </div>
      )}
      <div
        className={cn(
          "container mx-auto",
          variant === "centered" ? "text-center max-w-3xl" : "max-w-4xl"
        )}
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-6">{title}</h1>
        {subtitle && (
          <p className="text-xl text-muted-foreground mb-8">{subtitle}</p>
        )}
        <div
          className={cn(
            "flex gap-4 flex-wrap",
            variant === "centered" && "justify-center"
          )}
        >
          {mainCta?.text && mainCta?.url && (
            <Link href={mainCta.url}>
              <Button size="lg">{mainCta.text}</Button>
            </Link>
          )}
          {secondaryCta?.text && secondaryCta?.url && (
            <Link href={secondaryCta.url}>
              <Button size="lg" variant="outline">
                {secondaryCta.text}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
