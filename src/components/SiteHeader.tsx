"use client";
// 站点头部：标题 + 主题切换 + 主导航（起课 / 六步学习）。供首页与演示页复用，避免重复 markup。
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

interface Props {
  title: string;
  subtitle?: string;
  /** 当前高亮的导航项 */
  active: "divine" | "demo";
}

export default function SiteHeader({ title, subtitle, active }: Props) {
  const navCls = (isActive: boolean) =>
    `rounded-lg border px-4 py-2 text-sm transition-colors ${
      isActive
        ? "border-gold/60 bg-gold/10 text-gold"
        : "border-ash/40 text-ash hover:border-gold hover:text-paper"
    }`;

  return (
    <header className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-3xl font-bold text-gold">{title}</h1>
        {subtitle && <p className="text-sm text-ash mt-1">{subtitle}</p>}
      </div>
      <nav className="flex gap-2 text-sm items-center">
        <ThemeToggle />
        <Link href="/" className={navCls(active === "divine")}>
          🔮 起课
        </Link>
        <Link href="/demo" className={navCls(active === "demo")}>
          🎓 六步学习
        </Link>
      </nav>
    </header>
  );
}
