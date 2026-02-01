import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  // reactCompiler: true, // Disabled - not compatible with Payload CMS yet
  turbopack: false,
  images: {
    // Bruk optimalisering i produksjon, unoptimized lokalt for raskere dev
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        // Vercel Blob Storage CDN
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default withPayload(nextConfig);
