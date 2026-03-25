import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "peopleflow.tech" }],
        destination: "https://www.peopleflow.tech/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
