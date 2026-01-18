import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  // reactCompiler: true, // Disabled - not compatible with Payload CMS yet
  turbopack: false,
  images: {
    remotePatterns: [
     {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/media/file/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/api/media/file/**',
      },
    ],
  },
};

export default withPayload(nextConfig);
