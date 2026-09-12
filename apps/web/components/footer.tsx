import { CookieSettingsButton } from "@/components/consent";
import { type MediaResource, PayloadImage } from "@/components/payload-image";
import {
  type SocialLink,
  SocialRow,
  normalizeSocialLinks,
} from "@/components/social";
import { FloatingShapes, Heading, Text } from "@poynt/ui";
import { Mail, MapPin } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

interface FooterLink {
  label: string;
  linkType: "internal" | "external";
  page?: { slug: string } | null;
  url?: string;
  openInNewTab?: boolean;
}

interface FooterColumn {
  title: string;
  links?: FooterLink[];
}

/** Strukturert bunnlinje: hvert felt har sin faste plass i rendringen. */
export interface FooterLegal {
  companyName?: string | null;
  orgNumber?: string | null;
  address?: string | null;
  email?: string | null;
  disclaimer?: string | null;
}

interface FooterProps {
  siteName?: string;
  logo?: MediaResource | null;
  columns?: FooterColumn[];
  legal?: FooterLegal | null;
  showSocialLinks?: boolean;
  socialLinks?: SocialLink[];
  newsletter?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    buttonText?: string;
  };
}

function getHref(item: {
  linkType: string;
  page?: { slug: string } | null;
  url?: string;
}): string {
  if (item.linkType === "internal" && item.page) {
    return item.page.slug === "forside" ? "/" : `/${item.page.slug}`;
  }
  return item.url || "#";
}

// Årstallet i copyright-linjen: cacheComponents tillater ikke `new Date()`
// under prerender, så det caches med døgn-levetid i stedet.
async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer({
  siteName = "Poynt",
  logo,
  columns = [],
  legal,
  showSocialLinks = true,
  socialLinks = [],
  newsletter,
}: FooterProps) {
  const currentYear = await getCurrentYear();
  const socials = normalizeSocialLinks(socialLinks);
  const companyName = legal?.companyName?.trim() || siteName;
  const orgNumber = legal?.orgNumber?.trim();
  const address = legal?.address?.trim();
  const email = legal?.email?.trim();
  const disclaimer = legal?.disclaimer?.trim();

  return (
    <footer id="site-footer" className="relative mt-20 overflow-hidden">
      <div className="absolute -top-20 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-muted/40 pointer-events-none" />

      <div className="absolute inset-0 bg-muted/40" />

      <FloatingShapes variant="subtle" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16">
        {newsletter?.enabled && (
          <div className="mb-12 pb-12 border-b border-border">
            <div className="max-w-xl mx-auto text-center">
              <Heading variant="h3">
                {newsletter.title || "Meld deg på nyhetsbrevet"}
              </Heading>
              {newsletter.description && (
                <Text variant="muted" customStyles="mt-2">
                  {newsletter.description}
                </Text>
              )}
              <div className="mt-6 max-w-md mx-auto">
                <NewsletterForm buttonText={newsletter.buttonText} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              {logo?.url ? (
                <PayloadImage
                  media={logo}
                  alt={logo.alt || siteName}
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              ) : (
                <span className="text-xl font-bold text-foreground">
                  {siteName}
                </span>
              )}
            </Link>
            {showSocialLinks && socials.length > 0 && (
              <div className="mt-6">
                <Text
                  weight="semibold"
                  customStyles="mb-3 text-foreground text-sm"
                >
                  Sosiale medier
                </Text>
                <SocialRow links={socials} />
              </div>
            )}
          </div>

          {columns.map((column) => (
            <div key={`${column.title}-column`}>
              <Text weight="semibold" customStyles="mb-3 text-foreground">
                {column.title}
              </Text>
              <ul className="space-y-2">
                {column.links?.map((link, linkIndex) => (
                  <li key={`${column.title}-link-${linkIndex}`}>
                    <Link
                      href={getHref(link)}
                      target={link.openInNewTab ? "_blank" : undefined}
                      rel={
                        link.openInNewTab ? "noopener noreferrer" : undefined
                      }
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bunnlinje: firma/org.nr på én rad, kontaktinfo på neste, merknad
            under — og informasjonskapsler til høyre. Ingen fri tekst her;
            hvert felt rendres på sin faste plass. */}
        <div className="mt-12 flex flex-col gap-6 border-border border-t pt-8 text-muted-foreground text-sm md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-foreground">
              © {currentYear} {companyName}
              {orgNumber && (
                <span className="text-muted-foreground">
                  {" "}
                  · Org.nr {orgNumber}
                </span>
              )}
            </p>
            {(address || email) && (
              <ul className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
                {address && (
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    <span>{address}</span>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <a
                      href={`mailto:${email}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {email}
                    </a>
                  </li>
                )}
              </ul>
            )}
            {disclaimer && (
              <p className="text-muted-foreground/80 text-xs">{disclaimer}</p>
            )}
          </div>
          {/* Lovpålagt: samtykket skal kunne endres like lett som det ble gitt. */}
          <CookieSettingsButton className="shrink-0 self-start text-muted-foreground text-sm transition-colors hover:text-foreground md:self-end" />
        </div>
      </div>
    </footer>
  );
}
