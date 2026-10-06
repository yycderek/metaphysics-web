import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 独立输出去部署（standalone），配合容器/Docker
  output: "standalone",
  // 隐藏 X-Powered-By
  poweredByHeader: false,
  reactStrictMode: true,
  // 安全响应头（不加 CSP：页面含内联主题脚本与 SVG 内联样式，严格 CSP 会破坏且收益不成比例）
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
