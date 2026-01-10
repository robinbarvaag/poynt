import { CartProvider } from "@poynt/cart";
import { Header } from "@/components/header";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </CartProvider>
  );
}
