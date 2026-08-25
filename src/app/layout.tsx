import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "metaphysics-web · 玄学占卜平台",
  description: "多算法玄学占卜平台：内置大六壬起课引擎（天地盘、四课、三传、天将、六亲可视化）+ AI 断课，支持插件扩展",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      {/* 首帧前设置主题，避免闪烁；默认亮色，localStorage 无值时不动（亮） */}
      <Script id="theme-init" strategy="beforeInteractive">
        {`(function(){try{var t=localStorage.getItem("liuren-theme");if(t==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})()`}
      </Script>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
