"use client";

import { cn } from "@poynt/ui";
import {
  Book,
  Video,
  Check,
  Star,
  Rocket,
  Shield,
  Heart,
  MessageCircle,
  BarChart3,
  Clock,
} from "lucide-react";

const iconMap = {
  book: Book,
  video: Video,
  check: Check,
  star: Star,
  rocket: Rocket,
  shield: Shield,
  heart: Heart,
  message: MessageCircle,
  chart: BarChart3,
  clock: Clock,
} as const;

interface Feature {
  icon?: keyof typeof iconMap;
  title: string;
  description?: string;
}

interface FeaturesBlockProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  layout?: "grid-3" | "grid-2" | "grid-4" | "list";
  features: Feature[];
}

export function FeaturesBlock({
  eyebrow,
  title,
  description,
  layout = "grid-3",
  features,
}: FeaturesBlockProps) {
  const gridCols = {
    "grid-2": "md:grid-cols-2",
    "grid-3": "md:grid-cols-3",
    "grid-4": "md:grid-cols-2 lg:grid-cols-4",
    list: "grid-cols-1 max-w-2xl mx-auto",
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {(eyebrow || title || description) && (
          <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
            {eyebrow && (
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{title}</h2>
            )}
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <div className={cn("grid gap-8", gridCols[layout])}>
          {features?.map((feature, index) => {
            const Icon = feature.icon ? iconMap[feature.icon] : null;

            return (
              <div
                key={index}
                className={cn(
                  "group",
                  layout === "list"
                    ? "flex gap-4 items-start"
                    : "text-center p-6 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                )}
              >
                {Icon && (
                  <div
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary",
                      layout === "list" ? "w-12 h-12 shrink-0" : "w-14 h-14 mx-auto mb-4"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  {feature.description && (
                    <p className="text-muted-foreground">{feature.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
