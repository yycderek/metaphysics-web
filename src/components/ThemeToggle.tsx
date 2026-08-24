"use client";
// 主题切换：亮色（默认）/ 暗色，localStorage 持久化
import { useEffect, useState } from "react";

const STORAGE_KEY = "liuren-theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // 挂载时与当前 documentElement 状态同步（首帧 class 已由 layout 内联脚本设置）
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
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
