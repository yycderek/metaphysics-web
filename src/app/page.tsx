"use client";
// 首页：主区 = 智能占卜（对话框 + 算法选择）+ 高级用法（手动精确起课，用户主动开启）；
// 侧边栏 = 术语速查 + 历史对话；主题切换固定在右上角。
import { useState } from "react";
import "@/plugins"; // 副作用导入：注册本地算法插件
import type { DivinationResult, AlgorithmInput, AlgorithmAdapter } from "@/lib/algorithms/types";
import { buildDivination, listAdapters } from "@/lib/algorithms/registry";
import { DALIUREN_ID, rawKeShi } from "@/lib/algorithms/daliuren";
import DivineForm from "@/components/DivineForm";
import KeShiHeader from "@/components/KeShiHeader";
import TianPanDisk from "@/components/TianPanDisk";
import SikeCards from "@/components/SikeCards";
import SanchuanChain from "@/components/SanchuanChain";
import AiDuanke from "@/components/AiDuanke";
import DivinationAgent from "@/components/DivinationAgent";
import StepRenderer from "@/components/StepRenderer";
import SiteHeader from "@/components/SiteHeader";
import ThemeToggle from "@/components/ThemeToggle";
import LiuyaoPan from "@/components/LiuyaoPan";
import MeihuaPan from "@/components/MeihuaPan";
import SimpleResult from "@/components/SimpleResult";
import GlossaryPanel from "@/components/GlossaryPanel";
import HistoryPanel from "@/components/HistoryPanel";
import BackupPanel from "@/components/BackupPanel";
import { chuanTianjiang } from "@/lib/shike";

type Mode = "result" | "derive";

export default function HomePage() {
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [mode, setMode] = useState<Mode>("result");
  const [selectedId, setSelectedId] = useState<string>(DALIUREN_ID);
  const adapters: AlgorithmAdapter[] = listAdapters();
  const [advanced, setAdvanced] = useState(false);
  const [view, setView] = useState<"divine" | "help" | "history">("divine");

  const ks = result && result.algorithmId === DALIUREN_ID ? rawKeShi(result) : null;
  const chuan = ks ? chuanTianjiang(ks) : [];

  const onDivine = async (input: AlgorithmInput) => {
    setResult(await buildDivination(selectedId, input));
    setMode("result");
  };

  const onSelect = (id: string) => {
    setSelectedId(id);
    setMode("result");
  };

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm border transition-colors ${
      active
        ? "border-gold/60 bg-gold/10 text-gold"
        : "border-ash/40 text-ash hover:border-gold hover:text-paper"
    }`;

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-6">
      {/* 主题：固定右上角 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <SiteHeader
        title="玄学 · 占卜"
        subtitle="描述问题即可占课；想手动指定参数可开启下方「高级用法」"
      />

      {/* 移动端：占卜 / 术语 / 历史 切换（桌面隐藏） */}
      <div className="lg:hidden mt-4 flex gap-2">
        {(
          [
            ["divine", "🔮 占卜"],
            ["help", "📖 术语"],
            ["history", "📜 历史"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
              view === k ? "border-gold/60 bg-gold/10 text-gold" : "border-ash/40 text-ash"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* 主区 */}
        <div className={`space-y-6 ${view === "divine" ? "" : "hidden lg:block"}`}>
          <DivinationAgent />

          {/* 高级用法：用户主动开启后才展示 */}
          <section className="rounded-xl border border-ash/30 bg-ink-2 p-4">
            <button
              type="button"
              onClick={() => setAdvanced((s) => !s)}
              aria-expanded={advanced}
              className="text-sm font-bold text-gold"
            >
              {advanced ? "▲ 收起" : "🔧 高级用法 · 手动精确起课"}
            </button>
            {advanced && (
              <div className="mt-4 space-y-4">
                <DivineForm
                  adapters={adapters}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onDivine={onDivine}
                />

                {result ? (
                  <>
                    <div className="flex gap-2">
                      <button
                        className={tabCls(mode === "result")}
                        onClick={() => setMode("result")}
                        aria-pressed={mode === "result"}
                      >
                        📊 课式结果
                      </button>
                      <button
                        className={tabCls(mode === "derive")}
                        onClick={() => setMode("derive")}
                        aria-pressed={mode === "derive"}
                      >
                        🧭 推导过程
                      </button>
                    </div>

                    {mode === "result" ? (
                      ks ? (
                        <>
                          <KeShiHeader ks={ks} />
                          <section className="grid md:grid-cols-2 gap-6 items-start">
                            <div className="rounded-xl border border-ash/30 bg-ink p-4">
                              <h3 className="text-gold font-bold mb-3 text-center">天地盘</h3>
                              <TianPanDisk ks={ks} />
                            </div>
                            <div className="space-y-6">
                              <div className="rounded-xl border border-ash/30 bg-ink p-4">
                                <h3 className="text-gold font-bold mb-3">四课</h3>
                                <SikeCards ks={ks} />
                              </div>
                              <div className="rounded-xl border border-ash/30 bg-ink p-4">
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
                      ) : result.algorithmId === "liuyao" ? (
                        <section className="rounded-xl border border-ash/30 bg-ink p-4">
                          <LiuyaoPan raw={result.raw} />
                        </section>
                      ) : result.algorithmId === "meihua" ? (
                        <section className="rounded-xl border border-ash/30 bg-ink p-4">
                          <MeihuaPan raw={result.raw} />
                        </section>
                      ) : (
                        <section className="rounded-xl border border-ash/30 bg-ink p-4">
                          <h3 className="text-gold font-bold mb-2">
                            课式结果 · {result.algorithmName}
                          </h3>
                          <SimpleResult algorithmId={result.algorithmId} raw={result.raw} />
                        </section>
                      )
                    ) : (
                      <section className="rounded-xl border border-ash/30 bg-ink p-6">
                        <h3 className="text-gold font-bold mb-1">完整推导过程</h3>
                        <p className="text-xs text-ash mb-4">
                          一步步还原这课式的诞生过程（{result.algorithmName}）。
                        </p>
                        <StepRenderer result={result} />
                      </section>
                    )}

                    <AiDuanke result={result} />
                  </>
                ) : (
                  <p className="text-xs text-ash">
                    选择算法与参数后点击「起课」，课盘与解读将在此展示。
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* 侧边栏（移动端按 tab 显示，桌面全显） */}
        <aside className={`space-y-6 ${view === "divine" ? "hidden lg:block" : ""}`}>
          <div className={view === "help" ? "" : "hidden lg:block"}>
            <GlossaryPanel />
          </div>
          <div className={view === "history" ? "" : "hidden lg:block"}>
            <HistoryPanel />
            <div className="mt-4">
              <BackupPanel />
            </div>
          </div>
        </aside>
      </div>

      <footer className="text-center text-xs text-ash pt-6 mt-8 border-t border-ash/20">
        仅供文化娱乐参考，不构成医疗/法律/财务等专业建议
      </footer>
    </main>
  );
}
