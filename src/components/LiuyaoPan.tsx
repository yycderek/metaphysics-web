"use client";
// 六爻排盘视图：本卦/变卦卦象 + 六爻纳甲/六亲/六神表。
import HexagramDiagram from "./HexagramDiagram";
import { hexagramBinary } from "@/lib/algorithms/yijing";

interface SixYaoRaw {
  本卦?: string;
  变卦?: string;
  宫?: string;
  世爻?: string;
  应爻?: string;
  世位?: number;
  应位?: number;
  旬空?: string[];
  日柱?: string;
  爻?: Array<{
    爻位: string;
    变: string;
    纳: string;
    五行: string;
    六亲: string;
    六神: string;
  }>;
}

export default function LiuyaoPan({ raw }: { raw: unknown }) {
  const r = raw as SixYaoRaw;
  const ben = r.爻 ?? [];
  const benLines = ben.map((y) => ({
    yang: y.爻位.includes("阳"),
    moving: y.变 === "动",
    tag: y.六亲,
    extra: y.六神,
  }));
  const bianLines = (() => {
    if (!r.变卦) return [];
    try {
      const bin = hexagramBinary(r.变卦);
      return bin.map((b) => ({ yang: b === 1 }) as { yang: boolean });
    } catch {
      return [];
    }
  })();

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <HexagramDiagram
          title={`本卦 · ${r.本卦 ?? ""}`}
          lines={benLines}
          shiPos={r.世位}
          yingPos={r.应位}
        />
        <HexagramDiagram title={`变卦 · ${r.变卦 ?? ""}`} lines={bianLines} />
      </div>

      <div className="rounded-lg border border-ash/30 bg-ink-2 p-3 text-xs space-y-1">
        <div className="flex flex-wrap gap-x-4 text-ash">
          <span>宫：{r.宫}</span>
          <span>世爻：{r.世爻}</span>
          <span>应爻：{r.应爻}</span>
          <span>旬空：{(r.旬空 ?? []).join("")}</span>
          <span>占日：{r.日柱}</span>
        </div>
      </div>

      {ben.length > 0 && (
        <div className="rounded-lg border border-ash/30 bg-ink-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ash border-b border-ash/20">
                <th className="px-2 py-1 text-left">爻位</th>
                <th className="px-2 py-1 text-left">纳甲</th>
                <th className="px-2 py-1 text-left">五行</th>
                <th className="px-2 py-1 text-left">六亲</th>
                <th className="px-2 py-1 text-left">六神</th>
                <th className="px-2 py-1 text-left">动/静</th>
              </tr>
            </thead>
            <tbody>
              {ben.map((y, i) => (
                <tr key={i} className="border-b border-ash/10">
                  <td className="px-2 py-1 text-paper">{y.爻位}</td>
                  <td className="px-2 py-1 text-paper">{y.纳}</td>
                  <td className="px-2 py-1">{y.五行}</td>
                  <td className="px-2 py-1 text-gold">{y.六亲}</td>
                  <td className="px-2 py-1">{y.六神}</td>
                  <td className={`px-2 py-1 ${y.变 === "动" ? "text-vermilion" : "text-ash"}`}>
                    {y.变}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
