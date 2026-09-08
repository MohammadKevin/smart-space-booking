import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/member/spaces/explore",
        destination: "/dashboard/member/spaces/explore",
      },
      {
        source: "/dashboard/member/spaces",
        destination: "/dashboard/member/spaces/explore",
      },
    ];
  },
};

export default nextConfig;
