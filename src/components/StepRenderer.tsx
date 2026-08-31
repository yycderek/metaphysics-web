"use client";
// 通用步骤渲染器（阶段3）：任意算法的推导过程逐步展示
// - 大六壬步骤 → 专属视图（天盘圆盘/四课卡/三传链，复用现有组件）
// - 其他算法 / 未知步骤 → 通用 JSON 树视图兜底
// - 动画风格与原 StepDemo 一致（framer-motion），支持手动/自动播放
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DivinationResult, StepResult } from "@/lib/algorithms/types";
import { resolveStepView } from "@/lib/algorithms/stepViews";
import { rawKeShi } from "@/lib/algorithms/daliuren";
import type { KeShi } from "@/lib/types";
import { sikeEntries } from "@/lib/shike";
import TianPanDisk from "./TianPanDisk";
import SikeCards from "./SikeCards";
import SanchuanChain from "./SanchuanChain";
import DataView from "./DataView";
import { LiuyaoDemo, MeihuaDemo } from "./StepDemos";

/** 大六壬专属步骤视图 */
function DaliurenStepView({ step, ks }: { step: StepResult; ks: KeShi }) {
  const sike = sikeEntries(ks);
  switch (step.key) {
    case "di":
      return (
        <div className="text-center text-sm text-ash">
          地盘十二支：{" "}
          <span className="text-paper">{Array.from("子丑寅卯辰巳午未申酉戌亥").join(" ")}</span>
        </div>
      );
    case "tian":
      return (
        <div className="text-center">
          <TianPanDisk ks={ks} />
          <p className="text-sm text-ash mt-2">
            {ks.yuejiang}将加{ks.shizhi}时 → 天盘已生成（外层为天盘，★为贵人）
          </p>
        </div>
      );
    case "sike":
      return (
        <div>
          <SikeCards ks={ks} />
          <p className="text-sm text-ash mt-3 text-center">
            生克关系：{sike.filter((e) => e.isKe).length} 处有克
            {sike.filter((e) => e.isKe).map((e) => `（第${e.index}课${e.relation}）`)}
          </p>
        </div>
      );
    case "jiuzongmen": {
      const data = step.data as { method?: string; kename?: string };
      return (
        <div className="rounded-lg border border-gold/40 bg-ink-2 p-5 text-center">
          <div className="text-2xl font-bold text-gold">{data.kename ?? ks.kename}</div>
          <div className="mt-1 text-sm text-ash">判定方法：{data.method ?? ks.method}</div>
          <p className="mt-3 text-sm text-paper leading-relaxed">
            四课 {sike.map((e) => `${e.bottom}→${e.top}`).join("  ")}
            {"　"}→　{ks.kename}（{ks.method}）
          </p>
        </div>
      );
    }
    case "sanchuan":
      return (
        <div>
          <SanchuanChain ks={ks} />
        </div>
      );
    case "tianjiang": {
      const data = step.data as {
        chuanDetail?: {
          name: string;
          zhi: string;
          tianjiang: { short: string; full: string; zhushi: string };
          liuqin: string;
        }[];
      };
      const chuan = data.chuanDetail ?? [];
      return (
        <div className="space-y-4">
          <SanchuanChain ks={ks} />
          <div className="rounded-lg border border-ash/30 bg-ink-2 p-4">
            <div className="text-sm text-ash mb-2">三传细断</div>
            <div className="space-y-1.5">
              {chuan.map((c) => (
                <div key={c.name} className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="w-12 text-gold">{c.name}</span>
                  <span className="w-8 text-xl text-paper">{c.zhi}</span>
                  <span className="w-16">
                    {c.tianjiang.short}·{c.tianjiang.full}
                  </span>
                  <span className="text-xs text-ash flex-1">{c.tianjiang.zhushi}</span>
                  <span>六亲：{c.liuqin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    default:
      return <DataView data={step.data} />;
  }
}

interface Props {
  result: DivinationResult;
  /** 默认自动播放 */
  autoPlay?: boolean;
}

export default function StepRenderer({ result, autoPlay = false }: Props) {
  const steps = result.steps;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 换课式时回到第一步并停止播放（仅 result 引用变化时重置；StrictMode 双挂载安全）
  const prevResult = useRef<DivinationResult>(result);
  useEffect(() => {
    if (prevResult.current === result) return;
    prevResult.current = result;
    setStep(0);
    setPlaying(false);
  }, [result]);

  // 自动播放：每 2.5s 前进，到底自动停
  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= steps.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 2500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, steps.length]);

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-ash/30 bg-ink-2 p-6 text-center text-sm text-ash">
        该算法（{result.algorithmName}）未提供推导过程，仅支持结果模式。
      </div>
    );
  }

  const cur = steps[step];
  const ks = result.algorithmId === "daliuren" ? rawKeShi(result) : null;
  const viewKind = resolveStepView(result.algorithmId, cur.key);

  return (
    <div className="space-y-6">
      {/* 步骤控制 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => {
                setStep(i);
                setPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                i === step
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ash/30 text-ash hover:text-paper"
              }`}
            >
              {s.title.split("、")[0]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-lg border border-ash/40 px-4 py-2 text-sm text-ash hover:border-gold hover:text-paper transition-colors"
          >
            {playing ? "⏸ 暂停" : "▶ 自动演示"}
          </button>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border border-ash/40 px-4 py-2 text-sm disabled:opacity-30 hover:border-gold"
          >
            ← 上一步
          </button>
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={step === steps.length - 1}
            className="rounded-lg bg-vermilion px-4 py-2 text-sm disabled:opacity-30"
          >
            下一步 →
          </button>
        </div>
      </div>

      {/* 步骤标题 */}
      <div className="border-l-4 border-gold pl-4">
        <h3 className="text-2xl font-bold text-gold">{cur.title}</h3>
        <p className="mt-1 text-sm text-ash leading-relaxed">{cur.desc}</p>
      </div>

      {/* 步骤内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={cur.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {viewKind === "daliuren" && ks ? (
            <DaliurenStepView step={cur} ks={ks} />
          ) : viewKind === "liuyao" ? (
            <LiuyaoDemo step={cur} raw={result.raw} />
          ) : viewKind === "meihua" ? (
            <MeihuaDemo step={cur} raw={result.raw} />
          ) : (
            <DataView data={cur.data} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 进度 */}
      <div className="text-center text-xs text-ash">
        第 {step + 1} / {steps.length} 步
      </div>
    </div>
  );
}
