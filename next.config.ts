import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.50.92"],
  experimental: {
    authInterrupts: true,
  },
  output: "standalone",
}

export default nextConfig
