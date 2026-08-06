import "../globals.css";
import { UILinkProvider } from "@/components/ui-link-provider";
import { cn } from "@poynt/ui";
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
const onPoyntDescription =
  "Medlemsområdet til Poynt — verktøy, guider og kurs for markedsføringen din.";

export const metadata: Metadata = {
  title: {
    default: "On Poynt",
    template: "%s | On Poynt",
  },
  description: onPoyntDescription,
  robots: {
    index: false,
    follow: false,
  },
  // Alt her ligger bak innlogging, så SEO er uinteressant — men når et medlem
  // deler en lenke i Slack/Teams/meldinger skal kortet fortsatt se ordentlig
  // ut. Ett felles merkevare-kort (det dynamiske /api/og-image) for hele
  // området.
  openGraph: {
    siteName: "On Poynt",
    locale: "nb_NO",
    type: "website",
    title: "On Poynt",
    description: onPoyntDescription,
    images: [
      {
        url: `${siteUrl}/api/og-image?title=${encodeURIComponent("On Poynt")}`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function PlannerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="no"
      className={cn(poppins.variable, bricolage.variable)}
      suppressHydrationWarning
    >
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {/* Interne lenker i @poynt/ui skal navigere på klienten, ikke laste
            hele siden på nytt. */}
        <UILinkProvider>{children}</UILinkProvider>
      </body>
    </html>
  );
}

// Hele On Poynt-området er auth-gated og per-bruker-dynamisk — behold
// server-bundet navigasjon (opt-out fra Instant Navigations-kravet).
export const instant = false;
