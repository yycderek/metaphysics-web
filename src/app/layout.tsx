import type { Metadata } from "next";
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
