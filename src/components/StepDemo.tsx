"use client";
// 步骤演示：逐步展示起课全流程（地盘→天盘→四课→九宗门→三传→天将六亲）
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { KeShi } from "@/lib/types";
import { sikeEntries, chuanTianjiang } from "@/lib/shike";
import TianPanDisk from "./TianPanDisk";
import SikeCards from "./SikeCards";
import SanchuanChain from "./SanchuanChain";

const STEPS = [
  {
    key: "di",
    title: "一、定地盘",
    desc: "地盘十二支固定排布：子北午南，顺时针环列。这是整个课式的底座。",
  },
  {
    key: "tian",
    title: "二、安天盘",
    desc: "月将加占时：把月将支放在时辰支的位置上，其余十一支顺时针环排，天盘即成。",
  },
  {
    key: "sike",
    title: "三、排四课",
    desc: "以日干寄宫与日支为下神，逐课取天盘上神；第二课以下一课的上神为下神。",
  },
  {
    key: "jiuzongmen",
    title: "四、九宗门定三传",
    desc: "检查四课上下生克：有克走贼克/比用/涉害，无克走遥克/昴星/别责/八专，天地盘全同或对冲则走伏吟/返吟。",
  },
  {
    key: "sanchuan",
    title: "五、得三传",
    desc: "三传是课的灵魂：初传主事始，中传主事中，末传主事终。",
  },
  {
    key: "tianjiang",
    title: "六、布天将·断六亲",
    desc: "按日干贵人诀起贵人，昼夜分顺逆排十二天将；三传五行比照日干定六亲，吉凶昭然。",
  },
];

export default function StepDemo({ ks }: { ks: KeShi }) {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  const sike = sikeEntries(ks);
  const chuan = chuanTianjiang(ks);

  return (
    <div className="space-y-6">
      {/* 步骤控制 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
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
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border border-ash/40 px-4 py-2 text-sm disabled:opacity-30 hover:border-gold"
          >
            ← 上一步
          </button>
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={step === STEPS.length - 1}
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
          {cur.key === "di" && (
            <div className="text-center text-sm text-ash">
              地盘十二支：{" "}
              <span className="text-paper">{Array.from("子丑寅卯辰巳午未申酉戌亥").join(" ")}</span>
            </div>
          )}

          {cur.key === "tian" && (
            <div className="text-center">
              <TianPanDisk ks={ks} />
              <p className="text-sm text-ash mt-2">
                {ks.yuejiang}将加{ks.shizhi}时 → 天盘已生成（外层为天盘，★为贵人）
              </p>
            </div>
          )}

          {cur.key === "sike" && (
            <div>
              <SikeCards ks={ks} />
              <p className="text-sm text-ash mt-3 text-center">
                生克关系：{sike.filter((e) => e.isKe).length} 处有克
                {sike.filter((e) => e.isKe).map((e) => `（第${e.index}课${e.relation}）`)}
              </p>
            </div>
          )}

          {cur.key === "jiuzongmen" && (
            <div className="rounded-lg border border-gold/40 bg-ink-2 p-5 text-center">
              <div className="text-2xl font-bold text-gold">{ks.kename}</div>
              <div className="mt-1 text-sm text-ash">判定方法：{ks.method}</div>
              <p className="mt-3 text-sm text-paper leading-relaxed">
                四课 {sike.map((e) => `${e.bottom}→${e.top}`).join("  ")}
                {"　"}→　{ks.kename}（{ks.method}）
              </p>
            </div>
          )}

          {cur.key === "sanchuan" && (
            <div>
              <SanchuanChain ks={ks} />
            </div>
          )}

          {cur.key === "tianjiang" && (
            <div className="space-y-4">
              <SanchuanChain ks={ks} />
              <div className="rounded-lg border border-ash/30 bg-ink-2 p-4">
                <div className="text-sm text-ash mb-2">三传细断</div>
                <div className="space-y-1.5">
                  {chuan.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 text-sm">
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
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
