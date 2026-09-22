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
  title: "Internt | Poynt",
  robots: { index: false, follow: false },
};

/**
 * Egen rot for interne sider: ingen nettstedsmeny og ingen Payload-ramme, men
 * full tilgang til designsystemet (Tailwind + @poynt/ui) — som er nettopp det
 * Payload-admin ikke har, og grunnen til at boksalg-dashbordet bor her og ikke
 * inne i admin. Tilgang sjekkes på hver side (Payload-innlogging).
 */
export default function InternalRootLayout({
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
      <body className="bg-background min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

// Per bruker og alltid fersk — tallene skal aldri komme fra cache.
export const instant = false;
