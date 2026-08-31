"use client";
// 六爻 / 梅花 的图形化逐步演示（用于 StepRenderer 推导过程）。
import HexagramDiagram from "./HexagramDiagram";
import DataView from "./DataView";
import { hexagramBinary } from "@/lib/algorithms/yijing";
import type { StepResult } from "@/lib/algorithms/types";

function byName(name?: string): { yang: boolean }[] {
  if (!name) return [];
  try {
    return hexagramBinary(name.split("（")[0]).map((b) => ({ yang: b === 1 }));
  } catch {
    return [];
  }
}

interface LiuyaoRaw {
  本卦?: string;
  变卦?: string;
  宫?: string;
  世位?: number;
  应位?: number;
  旬空?: string[];
  日柱?: string;
  爻?: Array<{ 爻位: string; 变: string; 纳: string; 五行: string; 六亲: string; 六神: string }>;
}

export function LiuyaoDemo({ step, raw }: { step: StepResult; raw: unknown }) {
  const r = raw as LiuyaoRaw;
  const ben = (r.爻 ?? []).map((y) => ({
    yang: y.爻位.includes("阳"),
    moving: y.变 === "动",
    tag: y.六亲,
    extra: y.六神,
  }));

  if (step.key === "qi") {
    const tosses = (step.data as { 摇掷?: Array<{ 值: number; 爻: string }> }).摇掷 ?? [];
    return (
      <div className="space-y-2">
        <div className="text-sm text-ash">六次摇掷（自初爻至上爻）：</div>
        <div className="flex flex-wrap gap-2">
          {tosses.map((t, i) => (
            <span key={i} className="rounded-md border border-ash/30 bg-ink-2 px-3 py-1.5 text-sm">
              {t.爻} · {t.值}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (step.key === "ding") {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        <HexagramDiagram
          title={`本卦 · ${r.本卦 ?? ""}`}
          lines={ben}
          shiPos={r.世位}
          yingPos={r.应位}
        />
        <HexagramDiagram title={`变卦 · ${r.变卦 ?? ""}`} lines={byName(r.变卦)} />
      </div>
    );
  }
  if (step.key === "najia") {
    const ys = r.爻 ?? [];
    return (
      <div className="rounded-lg border border-ash/30 bg-ink-2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ash border-b border-ash/20">
              {["爻位", "纳甲", "五行", "六亲", "六神", "动静"].map((h) => (
                <th key={h} className="px-2 py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ys.map((y, i) => (
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
    );
  }
  if (step.key === "shiying") {
    return (
      <div className="space-y-3">
        <HexagramDiagram
          title={`本卦 · ${r.本卦 ?? ""}`}
          lines={ben}
          shiPos={r.世位}
          yingPos={r.应位}
        />
        <div className="text-xs text-ash">
          世爻为自己、应爻为对方/所测之事；世应相生则和、相冲则阻。
        </div>
      </div>
    );
  }
  if (step.key === "liushen") {
    return (
      <div className="rounded-lg border border-ash/30 bg-ink-2 p-3 text-xs space-y-1">
        <div className="text-ash">
          旬空：{(r.旬空 ?? []).join("")} · 占日：{r.日柱} · 宫：{r.宫}
        </div>
        <div className="text-paper/90">
          六神自初爻起，按占日干支排：青龙→朱雀→勾陈→螣蛇→白虎→玄武。
        </div>
      </div>
    );
  }
  return <DataView data={step.data} />;
}

interface MeihuaRaw {
  上卦?: string;
  下卦?: string;
  动爻?: string;
  本卦?: string;
  变卦?: string;
  互卦?: string;
  体卦?: string;
  用卦?: string;
  体用关系?: string;
}

export function MeihuaDemo({ step, raw }: { step: StepResult; raw: unknown }) {
  const r = raw as MeihuaRaw;
  const map: Record<string, string | undefined> = {
    ben: r.本卦,
    hu: r.互卦,
    bian: r.变卦,
  };
  const title: Record<string, string> = { ben: "本卦", hu: "互卦", bian: "变卦" };
  if (map[step.key]) {
    return (
      <HexagramDiagram
        title={`${title[step.key]} · ${map[step.key]}`}
        lines={byName(map[step.key])}
      />
    );
  }
  if (step.key === "tiyong") {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        <HexagramDiagram
          title={`体卦（我）· ${r.体卦 ?? ""}`}
          lines={byName((r.体卦 ?? "").split("（")[0])}
        />
        <HexagramDiagram
          title={`用卦（事）· ${r.用卦 ?? ""}`}
          lines={byName((r.用卦 ?? "").split("（")[0])}
        />
        <div className="sm:col-span-2 rounded-lg border border-gold/30 bg-ink-2 p-3 text-sm">
          体用关系：<span className="text-gold font-bold">{r.体用关系 ?? ""}</span>
        </div>
      </div>
    );
  }
  if (step.key === "guashu") {
    return (
      <div className="text-sm text-ash space-y-1">
        <div>上卦：{r.上卦}</div>
        <div>下卦：{r.下卦}</div>
      </div>
    );
  }
  return <DataView data={step.data} />;
}
