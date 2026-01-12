import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  reactCompiler: true,
  turbopack: false,
};

export default withPayload(nextConfig);
