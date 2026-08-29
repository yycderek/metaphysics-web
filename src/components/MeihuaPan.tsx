"use client";
// 梅花易数排盘视图：本卦/互卦/变卦卦象 + 上卦/下卦/动爻。
import HexagramDiagram from "./HexagramDiagram";
import { hexagramBinary } from "@/lib/algorithms/yijing";

interface MeihuaRaw {
  上卦?: string;
  下卦?: string;
  动爻?: string;
  本卦?: string;
  变卦?: string;
  互卦?: string;
  报数?: number[];
}

export default function MeihuaPan({ raw }: { raw: unknown }) {
  const r = raw as MeihuaRaw;
  const dong = r.动爻 ?? "";

  const ben = (() => {
    if (!r.本卦) return [];
    try {
      return hexagramBinary(r.本卦.split("（")[0]).map((b) => ({ yang: b === 1 }));
    } catch {
      return [];
    }
  })();
  const hu = (() => {
    if (!r.互卦) return [];
    try {
      return hexagramBinary(r.互卦).map((b) => ({ yang: b === 1 }));
    } catch {
      return [];
    }
  })();
  const bian = (() => {
    if (!r.变卦) return [];
    try {
      return hexagramBinary(r.变卦.split("（")[0]).map((b) => ({ yang: b === 1 }));
    } catch {
      return [];
    }
  })();

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <HexagramDiagram title={`本卦 · ${r.本卦 ?? ""}`} lines={ben} />
        <HexagramDiagram title={`互卦 · ${r.互卦 ?? ""}`} lines={hu} />
        <HexagramDiagram title={`变卦 · ${r.变卦 ?? ""}`} lines={bian} />
      </div>
      <div className="rounded-lg border border-ash/30 bg-ink-2 p-3 text-xs space-y-1 text-ash">
        <div className="flex flex-wrap gap-x-4">
          <span>报数：{(r.报数 ?? []).join("、")}</span>
          <span>上卦：{r.上卦}</span>
          <span>下卦：{r.下卦}</span>
          <span>动爻：{dong}</span>
        </div>
      </div>
    </div>
  );
}
