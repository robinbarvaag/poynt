// apps/web/app/layout.tsx
import "@poynt/tailwind-config/web.css"; // Import the v4 Tailwind configuration
import { cn } from "@poynt/ui/utils";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {children}
      </body>
    </html>
  );
}
