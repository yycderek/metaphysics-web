"use client";
// 主题切换：亮色 / 暗色，localStorage 持久化。
// 图标由 .dark 类经 CSS 切换（only-light / only-dark），首帧即正确，无闪烁。
import { IconMoon, IconSun } from "@/components/icons";

const STORAGE_KEY = "metaphysics-theme";
const LEGACY_KEY = "liuren-theme";

export default function ThemeToggle() {
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      localStorage.removeItem(LEGACY_KEY); // 迁移：清除旧键
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      title="切换亮 / 暗主题"
      aria-label="切换亮 / 暗主题"
      className="rounded-lg border border-ash/40 px-3 py-2 text-sm text-ash transition-colors hover:border-gold hover:text-gold"
    >
      <span className="only-light items-center gap-1.5">
        <IconMoon size={15} />
        <span>暗色</span>
      </span>
      <span className="only-dark items-center gap-1.5">
        <IconSun size={15} />
        <span>亮色</span>
      </span>
    </button>
  );
}
