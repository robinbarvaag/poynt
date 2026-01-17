import config from "@/payload.config";
import { Button } from "@poynt/ui";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

export default async function MyAccountPage() {
  const payload = await getPayload({ config });

  // Hent innlogga brukar
  const { user } = await payload.auth({ headers: new Headers() });

  if (!user) {
    redirect("/admin/login");
  }

  // Hent brukarens ordrer
  const orders = await payload.find({
    collection: "orders",
    where: {
      user: {
        equals: user.id,
      },
      status: {
        equals: "paid",
      },
    },
  });

  // Hent alle kjøpte produkt
  const purchasedProductIds = new Set<string>();
  orders.docs.forEach((order) => {
    order.items.forEach((item: any) => {
      if (typeof item.product === "string") {
        purchasedProductIds.add(item.product);
      } else if (item.product?.id) {
        purchasedProductIds.add(item.product.id);
      }
    });
  });

  const products = await payload.find({
    collection: "products",
    where: {
      id: {
        in: Array.from(purchasedProductIds),
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Min side</h1>
      <p className="text-muted-foreground mb-8">
        Velkommen tilbake, {user.email}
      </p>

      {products.docs.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">
            Du har ikkje kjøpt nokon kurs enno
          </h2>
          <p className="text-muted-foreground mb-8">
            Utforsk kursa våre og start læringa i dag!
          </p>
          <Link href="/kurs">
            <Button size="lg">Sjå alle kurs</Button>
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Mine kurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.docs.map((product) => (
              <Link
                key={product.id}
                href={`/min-side/kurs/${product.slug}`}
                className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {product.image &&
                  typeof product.image === "object" &&
                  product.image.url && (
                    <div className="relative aspect-video w-full bg-muted">
                      <Image
                        src={product.image.url}
                        alt={product.image.alt || product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <Button className="w-full mt-4" variant="default">
                    Start kurs
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
