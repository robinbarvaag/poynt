import { getPayload } from "payload";
import config from "@/payload.config";
import { ProductCard } from "@/components/product-card";

export default async function CoursesPage() {
  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    where: {
      active: {
        equals: true,
      },
    },
  });

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Alle kurs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.docs.map((product) => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>
    </div>
  );
}
