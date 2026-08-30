"use client";
// 站点头部（简化）：仅标题 + 副标题；主题切换为固定右上角（见 page 内浮动按钮）。
interface Props {
  title: string;
  subtitle?: string;
}

export default function SiteHeader({ title, subtitle }: Props) {
  return (
    <header>
      <h1 className="text-3xl font-bold text-gold">{title}</h1>
      {subtitle && <p className="text-sm text-ash mt-1">{subtitle}</p>}
    </header>
  );
}
