import config from "@/payload.config";
import { notFound } from "next/navigation";
import { generatePageMetadata } from "@payloadcms/next/utilities";

interface PageProps {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { segments } = await params;

  // Payload admin UI renders through the layout
  return null;
};

export default Page;
