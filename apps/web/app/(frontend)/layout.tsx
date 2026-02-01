import "../globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import config from "@payload-config";
import { cn } from "@poynt/ui";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Playfair_Display, Poppins } from "next/font/google";
import { getPayload } from "payload";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const siteName = "Poynt";
const siteDescription = "Din læringsplattform for kurs og opplæring";
const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "nb_NO",
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

async function getGlobals() {
  const payload = await getPayload({ config });

  const [siteSettings, header, footer] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }).catch(() => null),
    payload.findGlobal({ slug: "header" }).catch(() => null),
    payload.findGlobal({ slug: "footer" }).catch(() => null),
  ]);

  return { siteSettings, header, footer };
}

const getCachedGlobals = unstable_cache(getGlobals, ["globals"], {
  tags: ["globals"],
  revalidate: 60,
});

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteSettings, header, footer } = await getCachedGlobals();

  return (
    <html lang="no" className={`${poppins.variable} ${playfair.variable}`}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        <Header
          siteName={siteSettings?.siteName || "Poynt"}
          logo={siteSettings?.logo as { url: string; alt?: string } | null}
          showSearch={header?.showSearch ?? true}
          showLogin={header?.showLogin ?? true}
          ctaButton={header?.ctaButton as HeaderProps["ctaButton"]}
          navItems={header?.navItems as unknown as HeaderProps["navItems"]}
        />
        <main className="min-h-screen">{children}</main>
        <Footer
          siteName={siteSettings?.siteName || "Poynt"}
          logo={siteSettings?.logo as { url: string; alt?: string } | null}
          columns={footer?.columns as FooterProps["columns"]}
          bottomText={footer?.bottomText ?? undefined}
          showSocialLinks={footer?.showSocialLinks ?? true}
          socialLinks={siteSettings?.socialLinks as FooterProps["socialLinks"]}
          newsletter={
            footer?.showNewsletter
              ? {
                  enabled: footer.showNewsletter,
                  title: footer.newsletterTitle ?? undefined,
                  description: footer.newsletterDescription ?? undefined,
                }
              : undefined
          }
        />
      </body>
    </html>
  );
}

// Type helpers for props
interface HeaderProps {
  ctaButton?: {
    show?: boolean;
    text?: string;
    url?: string;
  };
  navItems?: {
    label: string;
    linkType: "custom" | "page" | "blog" | "product";
    url?: string;
    page?: { slug: string } | null;
    blogPost?: { slug: string } | null;
    product?: { slug: string } | null;
    openInNewTab?: boolean;
    subItems?: {
      label: string;
      description?: string;
      linkType: "custom" | "page" | "blog" | "product";
      url?: string;
      page?: { slug: string } | null;
      blogPost?: { slug: string } | null;
      product?: { slug: string } | null;
      openInNewTab?: boolean;
    }[];
  }[];
}

interface FooterProps {
  columns?: {
    title: string;
    links?: {
      label: string;
      linkType: "internal" | "external";
      page?: { slug: string } | null;
      url?: string;
      openInNewTab?: boolean;
    }[];
  }[];
  socialLinks?: {
    platform:
      | "facebook"
      | "instagram"
      | "twitter"
      | "linkedin"
      | "youtube"
      | "tiktok";
    url: string;
  }[];
}
