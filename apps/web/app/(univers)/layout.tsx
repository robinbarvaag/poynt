import "../globals.css";
import {
  ConsentProvider,
  CookieBanner,
  GoogleAnalytics,
  MetaPixel,
} from "@/components/consent";
import { Footer } from "@/components/footer";
import { SiteAnalytics } from "@/components/site-analytics";
import { normalizeSocialLinks } from "@/components/social";
import { UILinkProvider } from "@/components/ui-link-provider";
import { UniverseHeader } from "@/components/universe-header";
import { UniverseOutro } from "@/components/universe-outro";
import { CheckoutConsentProvider } from "@/lib/checkout-consent";
import { getSiteGlobals, getUniverseGlobal } from "@/lib/site-globals";
import { UNIVERSE } from "@/lib/universe";
import { Grain, cn } from "@poynt/ui";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Poppins } from "next/font/google";

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

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export const metadata: Metadata = {
  // Samme tittel-mal som resten av nettstedet («%s | Poynt»). `buildMetadata`
  // regner med akkurat den — et eget suffiks her hadde gitt «… | Verdifull
  // vekst» i tillegg til merkenavnet.
  title: {
    default: UNIVERSE.label,
    template: "%s | Poynt",
  },
  metadataBase: new URL(siteUrl),
  // Universet ligger bak bok-døra og er «unlisted» — det skal ikke indekseres.
  robots: {
    index: false,
    follow: false,
  },
};

type FooterProps = React.ComponentProps<typeof Footer>;

/**
 * Rammen rundt «Verdifull vekst-universet».
 *
 * Samme design, fonter, samtykke og bunntekst som resten av poynt.no — det er
 * ikke et annet nettsted, det er et rom inne i det samme. Forskjellen er
 * toppen: universets egen header (se `universe-header.tsx`) i stedet for
 * nettstedsmenyen, slik at man navigerer i innholdet mens man er inne, og
 * møter Poynt nederst når man er ferdig.
 */
export default async function UniverseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ siteSettings, footer, shopSettings }, universe] = await Promise.all([
    getSiteGlobals(),
    getUniverseGlobal(),
  ]);
  const socialLinks = normalizeSocialLinks(siteSettings?.socialLinks);
  const consentTexts = shopSettings
    ? {
        checkboxLabel: shopSettings.consentCheckboxLabel,
        dialogTitle: shopSettings.consentDialogTitle,
        dialogText: shopSettings.consentDialogText,
        errorMessage: shopSettings.consentErrorMessage,
      }
    : null;

  return (
    <html lang="no" className={`${poppins.variable} ${bricolage.variable}`}>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <ConsentProvider>
          <UILinkProvider>
            <CheckoutConsentProvider texts={consentTexts}>
              <UniverseHeader
                siteName={siteSettings?.siteName || "Poynt"}
                logo={
                  siteSettings?.logo as { url: string; alt?: string } | null
                }
                header={universe?.header}
              />
              {/* Samme `overflow-x-clip` som (frontend): dekor som stikker ut
                  av kolonnene skal ikke gi sidescroll, men sticky sidemeny
                  (HubLayout) må fortsatt virke. */}
              <main className="min-h-screen overflow-x-clip pt-16">
                {children}
              </main>
              <UniverseOutro outro={universe?.outro} />
            </CheckoutConsentProvider>
            {/* Hele nettstedet ligger her — man kommer bare hit ved å ha vært
                gjennom universet først. */}
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
          </UILinkProvider>
          <CookieBanner />
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        </ConsentProvider>
        <Grain fixed />
        <SiteAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
