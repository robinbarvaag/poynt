import { getPayload } from "payload";
import config from "@/payload.config";
import { redirect, notFound } from "next/navigation";
import { CoursePlayer } from "@/components/course-player";

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  // Hent innlogga brukar
  const { user } = await payload.auth({ headers: new Headers() });

  if (!user) {
    redirect("/admin/login");
  }

  // Finn produktet
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

  // Sjekk om brukaren har kjøpt produktet
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

  // Hent kursinnhald
  const courseContent = await payload.find({
    collection: "course-content",
    where: {
      product: {
        equals: product.id,
      },
    },
    limit: 1,
  });

  if (courseContent.docs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-muted-foreground">
          Kursinnhaldet er ikkje tilgjengeleg enno. Sjekk tilbake seinare!
        </p>
      </div>
    );
  }

  const content = courseContent.docs[0];

  return <CoursePlayer product={product as any} content={content as any} />;
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
