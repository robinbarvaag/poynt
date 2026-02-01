"use client";

import { getMediaUrl } from "@/lib/media-url";
import { Heading, cn } from "@poynt/ui";
import { Quote, Star } from "lucide-react";
import Image from "next/image";

interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  logo?: {
    url: string;
    alt?: string;
  };
  avatar?: {
    url: string;
    alt?: string;
  };
  rating?: number;
}

interface TestimonialsBlockProps {
  title?: string;
  layout?: "cards" | "slider" | "quote";
  testimonials: Testimonial[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-muted/50 rounded-2xl p-6 md:p-8 flex flex-col">
      {testimonial.logo && (
        <div className="relative h-12 w-32 mb-6">
          <Image
            src={getMediaUrl(testimonial.logo.url)}
            alt={testimonial.logo.alt || testimonial.company || "Logo"}
            fill
            className="object-contain object-left"
          />
        </div>
      )}
      {testimonial.rating && (
        <div className="mb-4">
          <StarRating rating={testimonial.rating} />
        </div>
      )}
      <div className="mb-6">
        <div className="font-semibold text-primary">{testimonial.author}</div>
        {(testimonial.role || testimonial.company) && (
          <div className="text-sm text-muted-foreground">
            {testimonial.role}
            {testimonial.role && testimonial.company && ", "}
            {testimonial.company}
          </div>
        )}
      </div>
      <blockquote className="text-base text-muted-foreground flex-1">
        "{testimonial.quote}"
      </blockquote>
    </div>
  );
}

export function TestimonialsBlock({
  title,
  layout = "cards",
  testimonials,
}: TestimonialsBlockProps) {
  if (layout === "quote" && testimonials?.length > 0) {
    const testimonial = testimonials[0];
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          {testimonial.logo && (
            <div className="relative h-16 w-40 mx-auto mb-8">
              <Image
                src={getMediaUrl(testimonial.logo.url)}
                alt={testimonial.logo.alt || testimonial.company || "Logo"}
                fill
                className="object-contain"
              />
            </div>
          )}
          <Quote className="w-12 h-12 mx-auto mb-6 text-primary/50" />
          <blockquote className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed">
            "{testimonial.quote}"
          </blockquote>
          <div className="flex flex-col items-center gap-3">
            {testimonial.avatar && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={getMediaUrl(testimonial.avatar.url)}
                  alt={testimonial.avatar.alt || testimonial.author}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <div className="font-semibold text-lg">{testimonial.author}</div>
              {(testimonial.role || testimonial.company) && (
                <div className="text-muted-foreground">
                  {testimonial.role}
                  {testimonial.role && testimonial.company && ", "}
                  {testimonial.company}
                </div>
              )}
            </div>
            {testimonial.rating && <StarRating rating={testimonial.rating} />}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {title && (
          <Heading size="h2" className="text-center mb-12">
            {title}
          </Heading>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials?.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
