import "../globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import config from "@payload-config";
import { Grain, cn } from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Bricolage_Grotesque, Poppins } from "next/font/google";
import { getPayload } from "payload";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
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
  "use cache";
  cacheTag("globals");
  cacheLife("minutes");

  const payload = await getPayload({ config });

  const [siteSettings, header, footer] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }).catch(() => null),
    payload.findGlobal({ slug: "header" }).catch(() => null),
    payload.findGlobal({ slug: "footer" }).catch(() => null),
  ]);

  return { siteSettings, header, footer };
}

export default async function FrontendLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const { siteSettings, header, footer } = await getGlobals();

  // Nettstedsdekkende strukturert data (GEO/SEO): organisasjon + nettsted.
  const siteJsonLd = [
    organizationSchema({
      name: siteSettings?.siteName,
      description: siteSettings?.siteDescription,
      logo: siteSettings?.logo,
      email: siteSettings?.email,
      phone: siteSettings?.phone,
      address: siteSettings?.address,
      socialLinks: siteSettings?.socialLinks,
    }),
    websiteSchema({ name: siteSettings?.siteName }),
  ];

  return (
    <html lang="no" className={`${poppins.variable} ${bricolage.variable}`}>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <JsonLd data={siteJsonLd} />
        <Header
          siteName={siteSettings?.siteName || "Poynt"}
          logo={siteSettings?.logo as { url: string; alt?: string } | null}
          ctaButton={header?.ctaButton as HeaderProps["ctaButton"]}
          navItems={header?.navItems as unknown as HeaderProps["navItems"]}
        />
        <main className="min-h-screen pt-16">{children}</main>
        {/* Parallel-route slot for intercepting-modaler (f.eks. /kontakt). */}
        {modal}
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
        {/* Redaksjonell signatur: ett fint korn-lag over hele siden */}
        <Grain fixed />
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
