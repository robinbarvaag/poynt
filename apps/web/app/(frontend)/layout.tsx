import { CheckoutConsentProvider } from "@/lib/checkout-consent";
import "../globals.css";
import {
  ConsentProvider,
  CookieBanner,
  GoogleAnalytics,
  MetaPixel,
} from "@/components/consent";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { SiteAnalytics } from "@/components/site-analytics";
import { SocialFab, normalizeSocialLinks } from "@/components/social";
import { UILinkProvider } from "@/components/ui-link-provider";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import config from "@payload-config";
import { Grain, cn } from "@poynt/ui";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  other: {
    "facebook-domain-verification": "a05he1h2j0guy6lz1jqm4g0x2sdlsf",
  },
};

async function getGlobals() {
  "use cache";
  cacheTag("globals");
  cacheLife("max");

  const payload = await getPayload({ config });

  const [siteSettings, header, footer, shopSettings] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }).catch(() => null),
    payload.findGlobal({ slug: "header" }).catch(() => null),
    payload.findGlobal({ slug: "footer" }).catch(() => null),
    // Samtykketekstene i kassen (handlekurv, kurv-skuff, produktside).
    payload
      .findGlobal({ slug: "shop-settings", depth: 0 })
      .catch(() => null),
  ]);

  return { siteSettings, header, footer, shopSettings };
}

export default async function FrontendLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const { siteSettings, header, footer, shopSettings } = await getGlobals();
  const socialLinks = normalizeSocialLinks(siteSettings?.socialLinks);
  const consentTexts = shopSettings
    ? {
        checkboxLabel: shopSettings.consentCheckboxLabel,
        dialogTitle: shopSettings.consentDialogTitle,
        dialogText: shopSettings.consentDialogText,
        errorMessage: shopSettings.consentErrorMessage,
      }
    : null;

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
      company: siteSettings?.company,
    }),
    websiteSchema({
      name: siteSettings?.siteName,
      description: siteSettings?.siteDescription,
    }),
  ];

  return (
    <html lang="no" className={`${poppins.variable} ${bricolage.variable}`}>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <JsonLd data={siteJsonLd} />
        {/* Samtykke først: GA lastes kun etter aktivt «ja» til statistikk,
            Meta Pixel kun etter «ja» til markedsføring, og banneret +
            footer-lenken deler samme kontekst. */}
        <ConsentProvider>
          {/* Kobler designsystemets interne lenker til next/link, så kort og
            knapper i @poynt/ui navigerer på klienten (instant navigation). */}
          <UILinkProvider>
            <CheckoutConsentProvider texts={consentTexts}>
              <Header
                siteName={siteSettings?.siteName || "Poynt"}
                logo={
                  siteSettings?.logo as { url: string; alt?: string } | null
                }
                ctaButton={header?.ctaButton as HeaderProps["ctaButton"]}
                navItems={
                  header?.navItems as unknown as HeaderProps["navItems"]
                }
              />
              {/* `overflow-x-clip` (ikke `hidden`): dekor som stikker ut av
                kolonnene (DecoBlob bak produktbildet, roterte kort) skal ikke
                gi sidescroll på mobil. `clip` lager – i motsetning til
                `hidden` – ingen scroll-container, så `position: sticky`
                (galleriet) fungerer fortsatt inne i main. */}
              <main className="min-h-screen overflow-x-clip pt-16">
                {children}
              </main>
              {/* Parallel-route slot for intercepting-modaler (f.eks. /kontakt). */}
              {modal}
            </CheckoutConsentProvider>
            <Footer
              siteName={siteSettings?.siteName || "Poynt"}
              logo={siteSettings?.logo as { url: string; alt?: string } | null}
              columns={footer?.columns as FooterProps["columns"]}
              legal={footer?.legal ?? undefined}
              showSocialLinks={footer?.showSocialLinks ?? true}
              socialLinks={socialLinks}
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
            {/* Kanalene følger med gjennom hele siden, og trekker seg
              tilbake når footeren – der de samme lenkene står – er synlig. */}
            {(siteSettings?.showSocialFab ?? true) && (
              <SocialFab links={socialLinks} />
            )}
          </UILinkProvider>
          <CookieBanner />
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        </ConsentProvider>
        {/* Redaksjonell signatur: ett fint korn-lag over hele siden */}
        <Grain fixed />
        {/* Vercel Web Analytics og Speed Insights: cookie-frie og krever ikke
            samtykke, så de ligger utenfor ConsentProvider og måler alle besøk
            – bortsett fra våre egne (se site-analytics.tsx, `?va=off`). */}
        <SiteAnalytics />
        <SpeedInsights />
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
