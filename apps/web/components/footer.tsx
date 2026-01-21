import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Button, H3, Text } from "@poynt/ui";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

interface SocialLink {
  platform:
    | "facebook"
    | "instagram"
    | "twitter"
    | "linkedin"
    | "youtube"
    | "tiktok";
  url: string;
}

interface FooterProps {
  siteName?: string;
  logo?: { url: string; alt?: string } | null;
  columns?: FooterColumn[];
  bottomText?: SerializedEditorState;
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

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
};

export function Footer({
  siteName = "Poynt",
  logo,
  columns = [],
  bottomText,
  showSocialLinks = true,
  socialLinks = [],
  newsletter,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Newsletter section */}
        {newsletter?.enabled && (
          <div className="mb-12 pb-12 border-b border-border">
            <div className="max-w-xl mx-auto text-center">
              <H3 className="mb-2">
                {newsletter.title || "Meld deg på nyhetsbrevet"}
              </H3>
              {newsletter.description && (
                <Text variant="muted" className="mb-6">
                  {newsletter.description}
                </Text>
              )}
              <form className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Din e-postadresse"
                  className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit">
                  {newsletter.buttonText || "Abonner"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Logo/brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              {logo ? (
                <Image
                  src={logo.url}
                  alt={logo.alt || siteName}
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              ) : (
                <span className="text-xl font-bold text-foreground">{siteName}</span>
              )}
            </Link>
            {showSocialLinks && socialLinks.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socialLinks.map((social, index) => {
                  const Icon = socialIcons[social.platform];
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <Text as="p" className="font-semibold mb-4">
                {column.title}
              </Text>
              <ul className="space-y-2">
                {column.links?.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={getHref(link)}
                      target={link.openInNewTab ? "_blank" : undefined}
                      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
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

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {bottomText ? (
              <RichText data={bottomText} />
            ) : (
              <Text variant="subtle">
                © {currentYear} {siteName}. Alle rettigheter reservert.
              </Text>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
