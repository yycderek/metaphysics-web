import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 独立输出去部署（standalone），配合容器/Docker
  output: "standalone",
  // 隐藏 X-Powered-By
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
