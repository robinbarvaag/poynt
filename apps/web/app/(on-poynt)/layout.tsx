import "../globals.css";
import { cn } from "@poynt/ui";
import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";

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

export const metadata: Metadata = {
  title: {
    default: "On Poynt",
    template: "%s | On Poynt",
  },
  description: "Planlegg og organiser markedsføringen din",
  robots: {
    index: false,
    follow: false,
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
      className={cn(poppins.variable, playfair.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
