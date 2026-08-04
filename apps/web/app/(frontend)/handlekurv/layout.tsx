import type { Metadata } from "next";
import type { ReactNode } from "react";

// Handlekurv-siden er en klientkomponent og kan ikke selv eksportere metadata —
// derfor ligger tittel + noindex her i layouten.
export const metadata: Metadata = {
  title: "Handlekurv",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
