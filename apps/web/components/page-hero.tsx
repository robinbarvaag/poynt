import { Container, cn } from "@poynt/ui";

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

export function PageHero({
  title,
  description,
  children,
  size = "default",
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "border-b border-border/50",
        size === "large" ? "py-8 md:py-12" : "py-6 md:py-8"
      )}
    >
      <Container>
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
