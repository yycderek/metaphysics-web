"use client";
// 首页：主区 = 智能占卜（对话框 + 算法选择）+ 高级用法（手动精确起课，用户主动开启）；
// 侧边栏 = 术语速查 + 历史对话；主题切换固定在右上角。
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "@/plugins"; // 副作用导入：注册本地算法插件
import type { DivinationResult, AlgorithmInput, AlgorithmAdapter } from "@/lib/algorithms/types";
import { buildDivination, listAdapters } from "@/lib/algorithms/registry";
import { DALIUREN_ID, rawKeShi } from "@/lib/algorithms/daliuren";
import DivineForm from "@/components/DivineForm";
import KeShiHeader from "@/components/KeShiHeader";
import TianPanDisk from "@/components/TianPanDisk";
import SikeCards from "@/components/SikeCards";
import SanchuanChain from "@/components/SanchuanChain";
import DivinationAgent from "@/components/DivinationAgent";
import SiteHeader from "@/components/SiteHeader";
import ThemeToggle from "@/components/ThemeToggle";
import SimpleResult from "@/components/SimpleResult";
import BackupPanel from "@/components/BackupPanel";
import { chuanTianjiang } from "@/lib/shike";
import {
  IconBook,
  IconChart,
  IconChevronDown,
  IconCompass,
  IconHistory,
  IconRoute,
  IconSliders,
} from "@/components/icons";

type Mode = "result" | "derive";

const AiDuanke = dynamic(() => import("@/components/AiDuanke"));
const StepRenderer = dynamic(() => import("@/components/StepRenderer"));
const LiuyaoPan = dynamic(() => import("@/components/LiuyaoPan"));
const MeihuaPan = dynamic(() => import("@/components/MeihuaPan"));
const GlossaryPanel = dynamic(() => import("@/components/GlossaryPanel"));
const HistoryPanel = dynamic(() => import("@/components/HistoryPanel"));

const MOBILE_TABS = [
  { key: "divine", label: "占卜", Icon: IconCompass },
  { key: "help", label: "术语", Icon: IconBook },
  { key: "history", label: "历史", Icon: IconHistory },
] as const;

export default function HomePage() {
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [mode, setMode] = useState<Mode>("result");
  const [selectedId, setSelectedId] = useState<string>(DALIUREN_ID);
  const adapters: AlgorithmAdapter[] = useMemo(() => listAdapters(), []);
  const [advanced, setAdvanced] = useState(false);
  const [view, setView] = useState<"divine" | "help" | "history">("divine");

  const ks = result && result.algorithmId === DALIUREN_ID ? rawKeShi(result) : null;
  const chuan = useMemo(() => (ks ? chuanTianjiang(ks) : []), [ks]);

  const onDivine = async (input: AlgorithmInput) => {
    setResult(await buildDivination(selectedId, input));
    setMode("result");
  };

  const onSelect = (id: string) => {
    setSelectedId(id);
    setMode("result");
  };

  const tabCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm border tracking-wider transition-colors ${
      active
        ? "border-gold/60 bg-gold/10 text-gold"
        : "border-ash/40 text-ash hover:border-gold hover:text-paper"
    }`;

  const panelH2 = "font-display text-base font-bold tracking-[0.25em] text-gold";

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-gold focus:text-ink focus:px-3 focus:py-2"
      >
        跳到主内容
      </a>
      <main id="main" className="min-h-screen max-w-6xl mx-auto px-4 py-6">
        {/* 主题：固定右上角 */}
        <div className="fixed top-4 right-4 z-50 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
          <ThemeToggle />
        </div>

        <SiteHeader
          title="玄学 · 占卜"
          subtitle="描述问题即可占课；想手动指定参数可开启下方「高级用法」"
        />

        {/* 移动端：占卜 / 术语 / 历史 切换（桌面隐藏） */}
        <div className="mt-4 flex gap-2 lg:hidden">
          {MOBILE_TABS.map(({ key: k, label, Icon }) => (
            <button
              key={k}
              onClick={() => setView(k)}
              aria-pressed={view === k}
              className={`inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm tracking-wider transition-colors ${
                view === k
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-ash/40 text-ash hover:border-gold hover:text-paper"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* 主区 */}
          <div className={`space-y-6 ${view === "divine" ? "" : "hidden lg:block"}`}>
            <DivinationAgent />

            {/* 高级用法：用户主动开启后才展示 */}
            <section className="rounded-md border border-ash/25 bg-ink-2 p-5">
              <button
                type="button"
                onClick={() => setAdvanced((s) => !s)}
                aria-expanded={advanced}
                className="inline-flex items-center gap-2 text-sm font-bold tracking-[0.2em] text-gold"
              >
                <IconSliders size={15} />
                高级用法 · 手动精确起课
                <IconChevronDown
                  size={15}
                  className={`transition-transform ${advanced ? "rotate-180" : ""}`}
                />
              </button>
              {advanced && (
                <div className="mt-5 space-y-5">
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
                          <IconChart size={15} />
                          课式结果
                        </button>
                        <button
                          className={tabCls(mode === "derive")}
                          onClick={() => setMode("derive")}
                          aria-pressed={mode === "derive"}
                        >
                          <IconRoute size={15} />
                          推导过程
                        </button>
                      </div>

                      {mode === "result" ? (
                        ks ? (
                          <>
                            <KeShiHeader ks={ks} />
                            <section className="grid md:grid-cols-2 gap-5 items-start">
                              <div className="flex gap-4 rounded-md border border-ash/25 bg-ink p-5">
                                <h2 className="vertical-rl shrink-0 select-none font-display text-sm font-bold text-gold">
                                  天地盘
                                </h2>
                                <div className="min-w-0 flex-1">
                                  <TianPanDisk ks={ks} />
                                </div>
                              </div>
                              <div className="space-y-5">
                                <div className="flex gap-4 rounded-md border border-ash/25 bg-ink p-5">
                                  <h2 className="vertical-rl shrink-0 select-none font-display text-sm font-bold text-gold">
                                    四课
                                  </h2>
                                  <div className="min-w-0 flex-1">
                                    <SikeCards ks={ks} />
                                  </div>
                                </div>
                                <div className="flex gap-4 rounded-md border border-ash/25 bg-ink p-5">
                                  <h2 className="vertical-rl shrink-0 select-none font-display text-sm font-bold text-gold">
                                    三传
                                  </h2>
                                  <div className="min-w-0 flex-1">
                                    <SanchuanChain ks={ks} />
                                    <div className="mt-4 border-t border-ash/20 pt-3 space-y-1.5 text-sm">
                                    {chuan.map((c) => (
                                      <div key={c.name} className="flex items-center gap-3">
                                        <span className="w-12 text-gold">{c.name}</span>
                                        <span className="w-8 font-display text-xl font-bold text-paper">
                                          {c.zhi}
                                        </span>
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
                              </div>
                            </section>
                          </>
                        ) : result.algorithmId === "liuyao" ? (
                          <section className="rounded-md border border-ash/25 bg-ink p-5">
                            <LiuyaoPan raw={result.raw} />
                          </section>
                        ) : result.algorithmId === "meihua" ? (
                          <section className="rounded-md border border-ash/25 bg-ink p-5">
                            <MeihuaPan raw={result.raw} />
                          </section>
                        ) : (
                          <section className="rounded-md border border-ash/25 bg-ink p-5">
                            <h2 className={`${panelH2} mb-3`}>
                              课式结果 · {result.algorithmName}
                            </h2>
                            <SimpleResult algorithmId={result.algorithmId} raw={result.raw} />
                          </section>
                        )
                      ) : (
                        <section className="rounded-md border border-ash/25 bg-ink p-6">
                          <h2 className={`${panelH2} mb-1`}>完整推导过程</h2>
                          <p className="mb-4 text-xs text-ash">
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
          <aside className={`space-y-5 ${view === "divine" ? "hidden lg:block" : ""}`}>
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

        <footer className="double-rule-top mt-10 pt-5 text-center text-xs tracking-wider text-ash">
          仅供文化娱乐参考，不构成医疗/法律/财务等专业建议
        </footer>
      </main>
    </>
  );
}
