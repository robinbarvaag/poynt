import config from "@payload-config";
import { PayloadPage } from "@payloadcms/next/views";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { segments } = await params;

  return (
    <PayloadPage config={config} params={params} searchParams={searchParams} />
  );
};

export default Page;
