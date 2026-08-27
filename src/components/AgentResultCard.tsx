"use client";
// Agent 结果卡：展示一次自主起课的卦象与解读。
// 简略 = 卦象(天地盘/四课/三传) + 结论；详细 = 推导过程(StepRenderer) + 逐步占断解读。
import { useState } from "react";
import type { AgentDivination } from "@/lib/agent/types";
import type { DivinationResult } from "@/lib/algorithms/types";
import { rawKeShi } from "@/lib/algorithms/daliuren";
import KeShiHeader from "@/components/KeShiHeader";
import TianPanDisk from "@/components/TianPanDisk";
import SikeCards from "@/components/SikeCards";
import SanchuanChain from "@/components/SanchuanChain";
import StepRenderer from "@/components/StepRenderer";
import DataTree from "@/components/DataTree";

interface Props {
  divination: DivinationResult | undefined;
  interpretation: AgentDivination;
}

export default function AgentResultCard({ divination, interpretation }: Props) {
  const isDaliuren = divination?.algorithmId === "daliuren";
  const ks = isDaliuren ? rawKeShi(divination!) : null;
  const [mode, setMode] = useState<"brief" | "detail">("brief");

  const tabCls = (active: boolean) =>
    `px-3 py-1 rounded-lg text-xs border transition-colors ${
      active ? "border-gold/60 bg-gold/10 text-gold" : "border-ash/40 text-ash hover:text-paper"
    }`;

  return (
    <div className="rounded-lg border border-ash/30 bg-ink p-4 space-y-4">
      {/* 卦象头 + 简略/详细切换 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm">
          <span className="text-gold font-bold">{interpretation.卦象}</span>
          {interpretation.吉凶 && (
            <span className="ml-2 text-ash">吉凶 · {interpretation.吉凶}</span>
          )}
          <span className="ml-2 text-xs text-ash">
            {interpretation.算法} · 置信度 {interpretation.置信度}
          </span>
        </div>
        <div className="flex gap-2">
          <button className={tabCls(mode === "brief")} onClick={() => setMode("brief")}>
            简略
          </button>
          <button className={tabCls(mode === "detail")} onClick={() => setMode("detail")}>
            详细
          </button>
        </div>
      </div>

      {interpretation.出处 && (
        <div className="text-xs text-ash/70">出处：{interpretation.出处}</div>
      )}

      {interpretation.依据 && (
        <div className="text-xs text-ash/70">
          依据（已核对引擎）：
          {[
            interpretation.依据.三传?.length ? `三传 ${interpretation.依据.三传.join("→")}` : "",
            interpretation.依据.天将?.length ? `天将 ${interpretation.依据.天将.join("/")}` : "",
            interpretation.依据.六亲?.length ? `六亲 ${interpretation.依据.六亲.join("/")}` : "",
            interpretation.依据.结果 ?? "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      )}

      {mode === "brief" ? (
        <div className="space-y-4">
          {/* 结论（简略解读） */}
          <div className="space-y-2 text-sm leading-relaxed">
            <div>
              <span className="text-gold font-bold mr-2">总断</span>
              {interpretation.结论.总断}
            </div>
            <div>
              <span className="text-gold font-bold mr-2">现状</span>
              {interpretation.结论.现状}
            </div>
            <div>
              <span className="text-jade font-bold mr-2">建议</span>
              {interpretation.结论.建议}
            </div>
            {interpretation.结论.风险 && (
              <div>
                <span className="text-vermilion font-bold mr-2">风险</span>
                {interpretation.结论.风险}
              </div>
            )}
          </div>

          {/* 卦象（课式）简略可视化 */}
          {divination ? (
            isDaliuren && ks ? (
              <>
                <KeShiHeader ks={ks} />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-ash/30 bg-ink-2 p-4">
                    <div className="text-gold font-bold text-center mb-2 text-sm">天地盘</div>
                    <TianPanDisk ks={ks} />
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-ash/30 bg-ink-2 p-4">
                      <div className="text-gold font-bold mb-2 text-sm">四课</div>
                      <SikeCards ks={ks} />
                    </div>
                    <div className="rounded-lg border border-ash/30 bg-ink-2 p-4">
                      <div className="text-gold font-bold mb-2 text-sm">三传</div>
                      <SanchuanChain ks={ks} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <DataTree data={divination.raw} />
            )
          ) : (
            <p className="text-xs text-ash">未返回课式（该轮未起课，直接基于上文解读）。</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 推导过程可视化 */}
          {divination && <StepRenderer result={divination} />}

          {/* 逐步占断解读（每一步 + 解读） */}
          {divination?.steps.length ? (
            <div className="space-y-3">
              {divination.steps.map((s, i) => {
                const interp = interpretation.逐步[i];
                return (
                  <div key={s.key} className="rounded-lg border border-ash/30 bg-ink-2 p-3">
                    <div className="text-sm font-bold text-gold">{s.title}</div>
                    <div className="text-xs text-ash mt-0.5">{s.desc}</div>
                    <div className="mt-2 text-sm text-paper/90">
                      <span className="text-jade font-bold mr-2">占断</span>
                      {interp?.解读 || "(无特别断义)"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-ash">该算法未提供推导步骤。</p>
          )}
        </div>
      )}
    </div>
  );
}
