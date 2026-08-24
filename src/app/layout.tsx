import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "liuren-web · 大六壬学习平台",
  description: "大六壬起课引擎 Web 版：天地盘、四课、三传、天将、六亲可视化",
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
