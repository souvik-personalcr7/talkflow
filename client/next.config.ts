import type { NextConfig } from "next";

const nextConfig: any = {
  /* config options here */
  allowedDevOrigins: ['192.168.29.143'],

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
