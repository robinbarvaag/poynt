import "../globals.css";
import { cn } from "@poynt/ui";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Poynt Planner",
    template: "%s | Poynt Planner",
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
    <html lang="no" className={inter.variable} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        {children}
      </body>
    </html>
  );
}
