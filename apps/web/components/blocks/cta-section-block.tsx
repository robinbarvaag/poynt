import { Button } from "@poynt/ui";
import { cn } from "@poynt/ui";
import Image from "next/image";
import Link from "next/link";

interface CtaSectionBlockProps {
  variant?: "simple" | "colored" | "image";
  title: string;
  description?: string;
  backgroundImage?: {
    url: string;
    alt?: string;
  };
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
  const content = (
    <div className="text-center max-w-2xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
      {description && (
        <p
          className={cn(
            "text-lg mb-8",
            variant === "image" ? "text-white/90" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      )}
      <div className="flex gap-4 justify-center flex-wrap">
        <Link href={primaryCta.url}>
          <Button size="lg">{primaryCta.text}</Button>
        </Link>
        {secondaryCta?.text && secondaryCta?.url && (
          <Link href={secondaryCta.url}>
            <Button
              size="lg"
              variant="outline"
              className={cn(
                variant === "image" &&
                  "border-white text-white hover:bg-white/10"
              )}
            >
              {secondaryCta.text}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  if (variant === "image" && backgroundImage) {
    return (
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 -z-10">
          <Image
            src={backgroundImage.url}
            alt={backgroundImage.alt || ""}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="container mx-auto px-4 text-white">{content}</div>
      </section>
    );
  }

  if (variant === "colored") {
    return (
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">{content}</div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">{content}</div>
    </section>
  );
}
