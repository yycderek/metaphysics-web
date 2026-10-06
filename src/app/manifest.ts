import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "玄学 · 占卜",
    short_name: "玄学占卜",
    description: "多算法玄学占卜平台：大六壬起课可视化 + AI 断课",
    start_url: "/",
    display: "standalone",
    background_color: "#15181b",
    theme_color: "#f6f2e8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
