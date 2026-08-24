"use client";
// 起课工具页：表单 → 注册表起课 → 双模式展示（课式结果 / 推导过程）
import { useState } from "react";
import type { DivinationResult, AlgorithmInput } from "@/lib/algorithms/types";
import { buildDivination } from "@/lib/algorithms/registry";
import { DALIUREN_ID, rawKeShi } from "@/lib/algorithms/daliuren";
import DivineForm from "@/components/DivineForm";
import KeShiHeader from "@/components/KeShiHeader";
import TianPanDisk from "@/components/TianPanDisk";
import SikeCards from "@/components/SikeCards";
import SanchuanChain from "@/components/SanchuanChain";
import AiDuanke from "@/components/AiDuanke";
import StepRenderer from "@/components/StepRenderer";
import { chuanTianjiang } from "@/lib/shike";

const GOLDEN_INPUT: AlgorithmInput = { rizhu: "庚子", shizhi: "午", yuejiang: "亥" };

type Mode = "result" | "derive";

export default function HomePage() {
  const [result, setResult] = useState<DivinationResult>(() =>
    buildDivination(DALIUREN_ID, GOLDEN_INPUT),
  );
  const [mode, setMode] = useState<Mode>("result");
  const ks = rawKeShi(result);
  const chuan = chuanTianjiang(ks);

  const onDivine = (input: AlgorithmInput) => {
    // 阶段4：算法选择（这里固定大六壬），错误向上冒泡给 DivineForm 展示
    setResult(buildDivination(DALIUREN_ID, input));
  };

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm border transition-colors ${
      active
        ? "border-gold/60 bg-gold/10 text-gold"
        : "border-ash/40 text-ash hover:border-gold hover:text-paper"
    }`;

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gold">大六壬 · 起课</h1>
          <p className="text-sm text-ash mt-1">
            月将加时 · 天地盘 · 四课 · 九宗门 · 三传 · 天将六亲
          </p>
        </div>
        <nav className="flex gap-2 text-sm">
          <a
            href="/"
            className="rounded-lg border border-gold/60 bg-gold/10 px-4 py-2 text-gold"
          >
            🔮 起课
          </a>
          <a
            href="/demo"
            className="rounded-lg border border-ash/40 px-4 py-2 text-ash hover:border-gold hover:text-paper transition-colors"
          >
            🎓 六步学习
          </a>
        </nav>
      </header>

      <DivineForm onDivine={onDivine} />

      {/* 双模式切换 */}
      <div className="flex gap-2">
        <button className={tabCls(mode === "result")} onClick={() => setMode("result")}>
          📊 课式结果
        </button>
        <button className={tabCls(mode === "derive")} onClick={() => setMode("derive")}>
          🧭 推导过程
        </button>
      </div>

      {mode === "result" ? (
        <>
          <KeShiHeader ks={ks} />

          <section className="grid md:grid-cols-2 gap-6 items-start">
            <div className="rounded-xl border border-ash/30 bg-ink-2 p-4">
              <h3 className="text-gold font-bold mb-3 text-center">天地盘</h3>
              <TianPanDisk ks={ks} />
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-ash/30 bg-ink-2 p-4">
                <h3 className="text-gold font-bold mb-3">四课</h3>
                <SikeCards ks={ks} />
              </div>
              <div className="rounded-xl border border-ash/30 bg-ink-2 p-4">
                <h3 className="text-gold font-bold mb-3">三传</h3>
                <SanchuanChain ks={ks} />
                <div className="mt-4 border-t border-ash/20 pt-3 space-y-1.5 text-sm">
                  {chuan.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="w-12 text-gold">{c.name}</span>
                      <span className="w-8 text-xl text-paper">{c.zhi}</span>
                      <span className="w-20">
                        {c.tianjiang.short}·{c.tianjiang.full}
                      </span>
                      <span className="text-xs text-ash flex-1">
                        {c.tianjiang.zhushi}
                      </span>
                      <span className="text-xs text-paper">六亲 {c.liuqin}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-ash/30 bg-ink-2 p-6">
          <h3 className="text-gold font-bold mb-1">完整推导过程</h3>
          <p className="text-xs text-ash mb-4">
            从定地盘到布天将，一步步还原这课式的诞生过程（{result.algorithmName}）。
          </p>
          <StepRenderer result={result} />
        </section>
      )}

      <AiDuanke ks={ks} />

      <footer className="text-center text-xs text-ash pt-4 border-t border-ash/20">
        起课引擎与 liuren-py 同源 · 黄金课例：庚子日 午时 亥将 → 重审课（巳戌卯）
      </footer>
    </main>
  );
}
