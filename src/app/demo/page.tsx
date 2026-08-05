"use client";
// 学习演示页：六步起课动画（黄金课例）
import { useState } from "react";
import type { KeShi } from "@/lib/types";
import { build } from "@/lib/shike";
import StepDemo from "@/components/StepDemo";

const GOLDEN: KeShi = build("庚子", "午", "亥");

export default function DemoPage() {
  const [ks] = useState<KeShi>(GOLDEN);

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gold">六步学会起课</h1>
          <p className="text-sm text-ash mt-1">
            黄金课例：庚子日 · 午时 · 亥将 → 重审课（三传 巳→戌→卯）
          </p>
        </div>
        <nav className="flex gap-2 text-sm">
          <a
            href="/"
            className="rounded-lg border border-ash/40 px-4 py-2 text-ash hover:border-gold hover:text-paper transition-colors"
          >
            🔮 去起课
          </a>
          <a
            href="/demo"
            className="rounded-lg border border-gold/60 bg-gold/10 px-4 py-2 text-gold"
          >
            🎓 六步学习
          </a>
        </nav>
      </header>

      <div className="rounded-xl border border-gold/30 bg-ink-2 p-4 text-sm text-ash leading-relaxed">
        六步口诀：<span className="text-paper">定地盘 → 安天盘 → 排四课 → 九宗门 → 得三传 → 布天将</span>
        。点上方步骤按钮或「下一步」逐步推进，每一步都对应一个真实课式。
      </div>

      <StepDemo ks={ks} />
    </main>
  );
}
