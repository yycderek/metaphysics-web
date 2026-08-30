import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "metaphysics-web · 玄学占卜平台",
  description:
    "多算法玄学占卜平台：内置大六壬起课引擎（天地盘、四课、三传、天将、六亲可视化）+ AI 断课，支持插件扩展",
  applicationName: "玄学 · 占卜",
  icons: { icon: "/icon.svg" },
  openGraph: {
    type: "website",
    title: "metaphysics-web · 玄学占卜平台",
    description:
      "大六壬起课可视化 + AI 断课。多算法占卜平台，天地盘、四课、三传、六亲，步进式推导过程。",
    locale: "zh_CN",
    siteName: "metaphysics-web",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#16130f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      {/* 默认暗色（墨底）。仅当用户显式存过 light 才移除 dark；SSR 就已带 dark，确保默认生效 */}
      <Script id="theme-init" strategy="beforeInteractive">
        {`(function(){try{var t=localStorage.getItem("metaphysics-theme");if(t==null)t=localStorage.getItem("liuren-theme");if(t==="light"){document.documentElement.classList.remove("dark")}}catch(e){}})()`}
      </Script>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
