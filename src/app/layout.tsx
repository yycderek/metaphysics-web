import type { Metadata, Viewport } from "next";
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
    { media: "(prefers-color-scheme: light)", color: "#eef2f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1114" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* 首帧前设置主题（body 首子节点的内联脚本，合法且先于绘制）；默认亮色，仅用户存过 dark 才加暗色 */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("metaphysics-theme");if(t==null)t=localStorage.getItem("liuren-theme");if(t==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
