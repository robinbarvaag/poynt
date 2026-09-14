import "../globals.css";
import { cn } from "@poynt/ui";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Innsjekk | Poynt",
  robots: { index: false, follow: false },
};

/**
 * Egen rot for innsjekk i døra: ingen nettstedsmeny og ingen Payload-ramme,
 * bare skanneren — laget for mobilen. Adgang sjekkes på siden (admin-innlogging).
 */
export default function CheckInRootLayout({
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
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

// Per-bruker og alltid fersk — ingen Instant Navigations-krav her.
export const instant = false;
