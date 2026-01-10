import Image from "next/image";
import Link from "next/link";
import { Button } from "@poynt/ui/button";

interface HeroBlockProps {
  title: string;
  subtitle?: string;
  image?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  cta?: {
    text?: string;
    url?: string;
  };
}

export function HeroBlock({ title, subtitle, image, cta }: HeroBlockProps) {
  return (
    <section className="relative py-20 px-4">
      {image && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={image.url}
            alt={image.alt || ""}
            fill
            className="object-cover opacity-20"
          />
        </div>
      )}
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4">{title}</h1>
        {subtitle && (
          <p className="text-xl text-muted-foreground mb-8">{subtitle}</p>
        )}
        {cta?.text && cta?.url && (
          <Link href={cta.url}>
            <Button size="lg">{cta.text}</Button>
          </Link>
        )}
      </div>
    </section>
  );
}
