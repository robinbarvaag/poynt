import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  // reactCompiler: true, // Disabled - not compatible with Payload CMS yet
  turbopack: false,
  // Instant Navigations (Next 16.3 preview): dynamisk-som-standard + gjenbrukbart
  // rute-skall som prefetches én gang per rute i stedet for per lenke
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Bruk optimalisering i produksjon, unoptimized lokalt for raskere dev
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        // Vercel Blob Storage CDN
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // Egen app-host: Payload serverer media som absolutt URL
        // (https://<host>/api/media/file/...), så Next sin image-optimizer må
        // godta hosten. *.vercel.app dekker både prod-aliaset og preview-deploys.
        protocol: "https",
        hostname: "*.vercel.app",
      },
      {
        // Egendomene (tas i bruk ved lansering)
        protocol: "https",
        hostname: "poynt.no",
      },
      {
        protocol: "https",
        hostname: "www.poynt.no",
      },
    ],
  },
};

export default withPayload(nextConfig);
