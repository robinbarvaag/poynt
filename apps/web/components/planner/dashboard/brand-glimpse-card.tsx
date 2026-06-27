import type { BrandIdentity } from "@poynt/planner-validators";
import { Button, Card, CardContent } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";

const BRAND_HREF = "/on-poynt/bedrifter";

interface BrandGlimpseCardProps {
  identity: BrandIdentity | null;
}

/**
 * Lite merkevare-glimt på dashbordet: logo + paletten + fonter, med snarvei til
 * merkevare-boka. Tomt → en rolig CTA om å sette den opp.
 */
export function BrandGlimpseCard({ identity }: BrandGlimpseCardProps) {
  const colors = (identity?.colors ?? []).filter((c) => c?.hex);
  const fonts = [identity?.fonts?.heading, identity?.fonts?.body].filter(
    (f): f is string => Boolean(f)
  );
  const hasIdentity =
    Boolean(identity?.logoUrl) || colors.length > 0 || fonts.length > 0;

  if (!hasIdentity) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon name="palette" className="size-5" />
          </span>
          <div>
            <p className="font-medium">Sett opp merkevaren din</p>
            <p className="text-muted-foreground text-sm">
              Logo, farger og fonter — så blir alt vi lager mer deg.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href={BRAND_HREF}>
              <Icon name="arrow-right" className="size-4" />
              Lag merkevare-boka
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-background ring-1 ring-foreground/10">
          {identity?.logoUrl ? (
            // biome-ignore lint/performance/noImgElement: ekstern blob-URL
            <img
              src={identity.logoUrl}
              alt="Logo"
              className="size-full object-contain p-1.5"
            />
          ) : (
            <Icon name="palette" className="size-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-medium text-sm">Merkevaren din</p>
          {colors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {colors.slice(0, 8).map((c, i) => (
                <span
                  key={`${c.hex}-${i}`}
                  className="size-4 rounded-full ring-1 ring-foreground/10"
                  style={{ backgroundColor: c.hex }}
                  title={c.name ?? c.hex}
                />
              ))}
            </div>
          )}
          {fonts.length > 0 && (
            <p className="truncate text-muted-foreground text-xs">
              {fonts.join(" · ")}
            </p>
          )}
        </div>

        <Button asChild size="sm" variant="ghost" className="shrink-0 gap-1.5">
          <Link href={BRAND_HREF}>
            Åpne
            <Icon name="arrow-right" className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
