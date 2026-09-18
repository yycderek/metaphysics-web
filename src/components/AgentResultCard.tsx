"use client";
// Agent 结果卡：展示一次自主起课的卦象与解读。
// 层次：卦象题头 → 引擎已核对依据 → 总断（视觉峰值 + 朱砂印）→ 课盘（弱化）→ 应验追踪。
// 单卦 = 简略(结论+课盘) / 详细(推导过程+逐步占断)；多卦 = 综断 + 对比表 + 逐卦解读。
import { useState } from "react";
import type { AgentDivination } from "@/lib/agent/types";
import type { DivinationResult } from "@/lib/algorithms/types";
import { rawKeShi } from "@/lib/algorithms/daliuren";
import { keShiSummary } from "@/lib/agent/divinate";
import KeShiHeader from "@/components/KeShiHeader";
import TianPanDisk from "@/components/TianPanDisk";
import SikeCards from "@/components/SikeCards";
import SanchuanChain from "@/components/SanchuanChain";
import StepRenderer from "@/components/StepRenderer";
import ShareCard from "@/components/ShareCard";
import LiuyaoPan from "@/components/LiuyaoPan";
import MeihuaPan from "@/components/MeihuaPan";
import SimpleResult from "@/components/SimpleResult";
import ChangyanTrack from "@/components/ChangyanTrack";
import Seal from "@/components/Seal";
import { IconCheck, IconCompass, IconShare } from "@/components/icons";
import { TermText } from "@/components/Term";

interface Props {
  divination: DivinationResult | undefined;
  interpretation: AgentDivination;
  /** 本次起出的全部卦（多卦综断/换时辰对比时提供） */
  divinations?: DivinationResult[];
  /** 应验追踪条目标识（由父级生成，稳定 per 卦） */
  entryId?: string;
  /** 问事事类（应验复盘用） */
  topic?: string;
}

export default function AgentResultCard({
  divination,
  interpretation,
  divinations,
  entryId,
  topic,
}: Props) {
  const isDaliuren = divination?.algorithmId === "daliuren";
  const ks = isDaliuren ? rawKeShi(divination!) : null;
  const [mode, setMode] = useState<"brief" | "detail">("brief");
  const [share, setShare] = useState(false);
  const isMulti = !!(interpretation.卦组?.length || (divinations && divinations.length > 1));

  const tabCls = (active: boolean) =>
    `inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs transition-colors ${
      active ? "border-gold/60 bg-gold/10 text-gold" : "border-ash/40 text-ash hover:text-paper"
    }`;

  const facts = interpretation.依据
    ? [
        interpretation.依据.三传?.length ? `三传 ${interpretation.依据.三传.join("→")}` : "",
        interpretation.依据.天将?.length ? `天将 ${interpretation.依据.天将.join("/")}` : "",
        interpretation.依据.六亲?.length ? `六亲 ${interpretation.依据.六亲.join("/")}` : "",
        interpretation.依据.结果 ?? "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="rise-in space-y-5 rounded-2xl border border-ash/30 bg-ink p-5">
      {/* 题头 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-gold">{interpretation.卦象}</span>
            {interpretation.吉凶 && (
              <span className="rounded-full border border-ash/40 px-2 py-0.5 text-xs text-ash">
                吉凶 · {interpretation.吉凶}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-ash">
            {interpretation.算法} · 置信度 {interpretation.置信度}（AI 自评）
          </div>
        </div>
        <div className="flex gap-2">
          {!isMulti && (
            <>
              <button className={tabCls(mode === "brief")} onClick={() => setMode("brief")}>
                简略
              </button>
              <button className={tabCls(mode === "detail")} onClick={() => setMode("detail")}>
                详细
              </button>
            </>
          )}
          <button
            className={tabCls(share)}
            aria-expanded={share}
            onClick={() => setShare((s) => !s)}
          >
            <IconShare size={12} />
            分享
          </button>
        </div>
      </div>

      {share && <ShareCard interpretation={interpretation} />}

      {/* 信任层：引擎已核对的硬依据，抬升为可读信息 */}
      {(facts || interpretation.出处) && (
        <div className="rounded-lg border border-jade/25 bg-jade/5 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-jade">
            <IconCheck size={12} />
            引擎已核对 · 依据
          </div>
          {facts && (
            <div className="mt-1 text-sm leading-relaxed text-paper/90">
              <TermText text={facts} />
            </div>
          )}
          {interpretation.出处 && (
            <div className="mt-1 text-xs text-ash">出处：{interpretation.出处}</div>
          )}
        </div>
      )}

      {isMulti ? (
        <MultiPan interpretation={interpretation} divinations={divinations} />
      ) : mode === "brief" ? (
        <div className="space-y-5">
          {/* 总断：视觉峰值 */}
          <div className="flex items-start gap-4">
            <Seal char="断" size={54} stamp className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] tracking-[0.2em] text-ash">总断</div>
              <p className="mt-1 text-lg leading-relaxed text-paper md:text-xl">
                <TermText text={interpretation.结论.总断} />
              </p>
            </div>
          </div>

          <dl className="space-y-2 text-sm leading-relaxed">
            <div className="flex gap-3">
              <dt className="w-10 shrink-0 pt-0.5 text-xs text-ash">现状</dt>
              <dd className="text-paper/90">
                <TermText text={interpretation.结论.现状} />
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-10 shrink-0 pt-0.5 text-xs text-jade">建议</dt>
              <dd className="text-paper/90">
                <TermText text={interpretation.结论.建议} />
              </dd>
            </div>
            {interpretation.结论.风险 && (
              <div className="flex gap-3">
                <dt className="w-10 shrink-0 pt-0.5 text-xs text-vermilion">风险</dt>
                <dd className="text-paper/90">{interpretation.结论.风险}</dd>
              </div>
            )}
          </dl>

          {/* 课盘：弱化处理，让总断成为焦点 */}
          <div className="space-y-4 border-t border-ash/15 pt-4">
            <div className="flex items-center gap-1.5 text-[11px] tracking-wide text-ash">
              <IconCompass size={13} />
              课盘
            </div>
            {divination ? (
              isDaliuren && ks ? (
                <>
                  <KeShiHeader ks={ks} />
                  <div className="grid items-start gap-5 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-xs text-ash">天地盘</div>
                      <TianPanDisk ks={ks} />
                    </div>
                    <div className="space-y-5">
                      <div>
                        <div className="mb-2 text-xs text-ash">四课</div>
                        <SikeCards ks={ks} />
                      </div>
                      <div>
                        <div className="mb-2 text-xs text-ash">三传</div>
                        <SanchuanChain ks={ks} />
                      </div>
                    </div>
                  </div>
                </>
              ) : divination.algorithmId === "liuyao" ? (
                <LiuyaoPan raw={divination.raw} />
              ) : divination.algorithmId === "meihua" ? (
                <MeihuaPan raw={divination.raw} />
              ) : (
                <SimpleResult algorithmId={divination.algorithmId} raw={divination.raw} />
              )
            ) : (
              <p className="text-xs text-ash">未返回课式（该轮未起课，直接基于上文解读）。</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 border-t border-ash/15 pt-4">
          {divination && <StepRenderer result={divination} />}
          {divination?.steps.length ? (
            <div className="space-y-3">
              {divination.steps.map((s, i) => {
                const interp = interpretation.逐步[i];
                return (
                  <div key={s.key} className="border-l-2 border-ash/25 pl-3">
                    <div className="text-sm font-bold text-gold">{s.title}</div>
                    <div className="mt-0.5 text-xs text-ash">{s.desc}</div>
                    <div className="mt-2 text-sm text-paper/90">
                      <span className="mr-2 font-bold text-jade">占断</span>
                      <TermText text={interp?.解读 || "(无特别断义)"} />
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

      {entryId && divination && (
        <ChangyanTrack
          id={entryId}
          algorithmId={divination.algorithmId}
          topic={topic}
          卦象={interpretation.卦象}
          总结={interpretation.结论.总断}
        />
      )}
    </div>
  );
}

/** 多卦综断：综合结论 + 对比表 + 逐卦解读 */
function MultiPan({
  interpretation,
  divinations,
}: {
  interpretation: AgentDivination;
  divinations?: DivinationResult[];
}) {
  const groups = interpretation.卦组 ?? [];
  const rows = groups.length
    ? groups.map((g, i) => ({
        卦象: g.卦象,
        吉凶: g.吉凶,
        要点: g.要点,
        结论: g.结论,
        divination: divinations?.[i],
      }))
    : (divinations ?? []).map((d) => ({
        卦象: keShiSummary(d),
        吉凶: undefined as "吉" | "中" | "凶" | undefined,
        要点: d.raw ? String((d.raw as { kename?: string }).kename ?? "") : "",
        结论: "",
        divination: d,
      }));

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <Seal char="综" size={54} stamp className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 text-sm leading-relaxed">
          <div>
            <span className="mr-2 text-xs text-ash">综断</span>
            {interpretation.结论.总断}
          </div>
          <div>
            <span className="mr-2 text-xs text-ash">现状</span>
            {interpretation.结论.现状}
          </div>
          <div>
            <span className="mr-2 text-xs text-jade">建议</span>
            {interpretation.结论.建议}
          </div>
          {interpretation.结论.风险 && (
            <div>
              <span className="mr-2 text-xs text-vermilion">风险</span>
              {interpretation.结论.风险}
            </div>
          )}
        </div>
      </div>

      {rows.length > 1 && (
        <div className="overflow-x-auto rounded-lg border border-ash/20">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ash/20 text-ash">
                <th className="w-28 px-2 py-1.5 text-left">卦象</th>
                <th className="w-16 px-2 py-1.5 text-left">吉凶</th>
                <th className="px-2 py-1.5 text-left">要点</th>
                <th className="px-2 py-1.5 text-left">结论</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-ash/10 align-top">
                  <td className="px-2 py-1.5 text-gold">{r.卦象}</td>
                  <td className="px-2 py-1.5">{r.吉凶 ?? "-"}</td>
                  <td className="px-2 py-1.5 text-paper/90">{r.要点}</td>
                  <td className="px-2 py-1.5 text-paper/90">{r.结论}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((g, i) => (
            <div key={i} className="border-l-2 border-ash/25 pl-3 text-sm">
              <span className="mr-2 font-bold text-gold">{g.卦象}</span>
              {g.吉凶 && <span className="text-xs text-ash">{g.吉凶}</span>}
              <div className="text-paper/90">{g.结论}</div>
              {g.建议 && <div className="text-xs text-jade">建议：{g.建议}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
