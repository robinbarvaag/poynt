import config from "@/payload.config";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const { user } = await payload.auth({ headers: new Headers() });

  if (!user) {
    redirect("/admin/login");
  }

  const products = await payload.find({
    collection: "products",
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  });

  if (products.docs.length === 0) {
    notFound();
  }

  const product = products.docs[0];

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

  const hasPurchased = orders.docs.some((order) =>
    order.items.some((item: any) => {
      const productId =
        typeof item.product === "string" ? item.product : item.product?.id;
      return productId === product.id;
    })
  );

  if (!hasPurchased) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Ingen tilgang</h1>
        <p className="text-muted-foreground mb-8">
          Du må kjøpe dette kurset for å få tilgang til innhaldet.
        </p>
      </div>
    );
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    where: {
      type: {
        equals: "course",
      },
    },
    limit: 1000,
  });

  return products.docs.map((product) => ({
    slug: product.slug,
  }));
}
