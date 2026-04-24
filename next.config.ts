import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: [
        "www.peopleflow.tech",
        "peopleflow.tech",
      ],
    },
  },
  async redirects() {
    return [
      {
        source: "/reclutamiento/vacantes/:id",
        destination: "/reclutamiento/vacantes?vacancyId=:id",
        permanent: false,
      },
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
