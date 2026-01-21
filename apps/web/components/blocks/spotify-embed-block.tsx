import { Heading, cn } from "@poynt/ui";
import { Headphones, Music2 } from "lucide-react";

interface SpotifyEmbedBlockProps {
  embedType: "episode" | "show" | "playlist";
  spotifyUrl: string;
  title?: string;
  height?: "compact" | "standard" | "large";
  theme?: "auto" | "light" | "dark";
}

function extractSpotifyId(url: string): { type: string; id: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    if (pathParts.length >= 2) {
      return {
        type: pathParts[0],
        id: pathParts[1].split("?")[0],
      };
    }
  } catch {
    // Try to extract from various formats
    const patterns = [
      /spotify\.com\/(episode|show|playlist|track|album)\/([a-zA-Z0-9]+)/,
      /spotify:(\w+):([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { type: match[1], id: match[2] };
      }
    }
  }
  return null;
}

function getHeightValue(height: string): number {
  switch (height) {
    case "compact":
      return 152;
    case "standard":
      return 352;
    case "large":
      return 500;
    default:
      return 352;
  }
}

export function SpotifyEmbedBlock({
  embedType,
  spotifyUrl,
  title,
  height = "compact",
  theme = "auto",
}: SpotifyEmbedBlockProps) {
  const extracted = extractSpotifyId(spotifyUrl);

  if (!extracted) {
    return (
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-destructive">
              Ugyldig Spotify URL. Sjekk at lenken er korrekt.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const embedHeight = getHeightValue(height);
  const themeParam = theme !== "auto" ? `&theme=${theme === "dark" ? "0" : "1"}` : "";
  const embedUrl = `https://open.spotify.com/embed/${extracted.type}/${extracted.id}?utm_source=generator${themeParam}`;

  const isCompact = height === "compact";
  const isLarge = height === "large";

  return (
    <section className="relative py-12 md:py-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4">
        {/* Header with icon */}
        {title && (
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              {embedType === "episode" || embedType === "show" ? (
                <Headphones className="w-6 h-6 text-primary" />
              ) : (
                <Music2 className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {embedType === "episode"
                  ? "Lytt til episode"
                  : embedType === "show"
                    ? "Podkast"
                    : "Spilleliste"}
              </p>
              <Heading size="h3" className="text-foreground">
                {title}
              </Heading>
            </div>
          </div>
        )}

        {/* Spotify embed container */}
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden shadow-xl",
            "border border-border/50",
            "bg-gradient-to-br from-card to-card/80",
            isLarge && "shadow-2xl"
          )}
        >
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className={cn("p-4", isCompact ? "p-3" : "p-4 md:p-6")}>
            <iframe
              src={embedUrl}
              width="100%"
              height={embedHeight}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
              title={title || "Spotify embed"}
            />
          </div>
        </div>

        {/* Optional footer text for shows/podcasts */}
        {(embedType === "show" || embedType === "episode") && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Klikk for å lytte direkte i Spotify
          </p>
        )}
      </div>
    </section>
  );
}
