"use client";
// 学习演示页：起课全流程动画（黄金课例），由 StepRenderer 驱动（阶段3 通用化）
import { useState } from "react";
import type { DivinationResult } from "@/lib/algorithms/types";
import { daliurenAdapter } from "@/lib/algorithms/daliuren";
import StepRenderer from "@/components/StepRenderer";
import SiteHeader from "@/components/SiteHeader";

const GOLDEN: DivinationResult = daliurenAdapter.build({
  rizhu: "庚子",
  shizhi: "午",
  yuejiang: "亥",
}) as DivinationResult;

export default function DemoPage() {
  const [result] = useState<DivinationResult>(GOLDEN);

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-6">
      <SiteHeader
        title="六步学会起课"
        subtitle="黄金课例：庚子日 · 午时 · 亥将 → 重审课（三传 巳→戌→卯）"
        active="demo"
      />

      <div className="rounded-xl border border-gold/30 bg-ink-2 p-4 text-sm text-ash leading-relaxed">
        六步口诀：
        <span className="text-paper">定地盘 → 安天盘 → 排四课 → 九宗门 → 得三传 → 布天将</span>
        。点「▶ 自动演示」全流程播放，或点步骤按钮 /「下一步」逐步推进，每一步都对应一个真实课式。
      </div>

      <StepRenderer result={result} autoPlay />
    </main>
  );
}
