"use client";
// 站点头部：朱砂落款 + 品牌题名 + 一句说明，作为「静室起课」的题头。
import Seal from "@/components/Seal";

interface Props {
  title: string;
  subtitle?: string;
}

export default function SiteHeader({ title, subtitle }: Props) {
  return (
    <header className="flex items-start gap-4 border-b border-ash/20 pb-4">
      <Seal char="玄" size={48} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-[0.22em] text-gold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ash">{subtitle}</p>}
      </div>
    </header>
  );
}
