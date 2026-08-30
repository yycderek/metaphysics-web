"use client";
// 主题切换：亮色（默认）/ 暗色，localStorage 持久化
import { useState } from "react";

const STORAGE_KEY = "metaphysics-theme";
const LEGACY_KEY = "liuren-theme";

export default function ThemeToggle() {
  // 首帧 class 已由 layout 内联脚本设置；默认暗色。此处惰性读取，SSR 时守卫 document 不存在
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  const toggle = () => {
    const next = !dark;
    setDark(next);
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
      title={dark ? "切换到亮色主题" : "切换到暗色主题"}
      aria-label={dark ? "切换到亮色主题" : "切换到暗色主题"}
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        dark
          ? "border-gold/60 bg-gold/10 text-gold"
          : "border-ash/40 text-ash hover:border-gold hover:text-paper"
      }`}
    >
      {dark ? "☀️ 亮色" : "🌙 暗色"}
    </button>
  );
}
