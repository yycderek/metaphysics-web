"use client";
// 分享卡：把卦象 + 断语渲染成一张玄学风竖版图（SVG），可下载 PNG 或复制到剪贴板。
import { useMemo, useRef, useState } from "react";
import LiveNote from "./LiveNote";
import { IconCopy, IconDownload } from "@/components/icons";
import type { AgentDivination } from "@/lib/agent/types";

interface Props {
  interpretation: AgentDivination;
}

// 主题变量 + 亮色回退：页面上随 .dark 翻转；导出为独立 SVG 时变量缺失，序列化前替换为当前主题实际值
const WIDTH = 620;
const HEIGHT = 820;
const THEME_VARS = [
  ["--qinghua", "#30587d"],
  ["--paper", "#2b251b"],
  ["--ash", "#6e6350"],
  ["--ink-2", "#fcfaf3"],
  ["--vermilion", "#b4362a"],
] as const;
const GOLD = "var(--qinghua, #30587d)"; // 青花黛蓝
const PAPER = "var(--paper, #2b251b)"; // 墨色
const ASH = "var(--ash, #6e6350)"; // 纸灰
const INK = "var(--ink-2, #fcfaf3)"; // 册页底
const VERMILION = "var(--vermilion, #b4362a)"; // 朱砂

/** 序列化 SVG 前把 var(--x, fallback) 替换为当前主题计算值，保证导出图与屏上一致 */
function resolveThemeColors(xml: string): string {
  const cs = getComputedStyle(document.documentElement);
  let out = xml;
  for (const [name, fallback] of THEME_VARS) {
    const value = cs.getPropertyValue(name).trim() || fallback;
    out = out.split(`var(${name}, ${fallback})`).join(value);
  }
  return out;
}

/** 按每行字数折行，超出上限截断 */
function wrap(text: string, per: number, maxLines: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length && lines.length < maxLines; i += per) {
    lines.push(text.slice(i, i + per));
  }
  return lines;
}

async function svgToPng(svg: SVGSVGElement): Promise<Blob> {
  const xml = resolveThemeColors(new XMLSerializer().serializeToString(svg));
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("导出图片失败"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return new Promise((resolve) => canvas.toBlob((b) => b && resolve(b), "image/png"));
}

export default function ShareCard({ interpretation }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"download" | "copy" | null>(null);

  const download = async () => {
    if (!svgRef.current || busy) return;
    setBusy("download");
    try {
      const blob = await svgToPng(svgRef.current);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `占卜-${interpretation.卦象.replace(/[\\/:*?"<>|]/g, "")}.png`;
      a.click();
      // 延后释放，避免浏览器读取前 URL 已被回收导致下载失败
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setNote("已下载");
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!svgRef.current || busy) return;
    setBusy("copy");
    try {
      const blob = await svgToPng(svgRef.current);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setNote("已复制图片");
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const facts = useMemo(
    () =>
      [
        interpretation.依据?.三传?.length ? `三传 ${interpretation.依据.三传.join("→")}` : "",
        interpretation.依据?.天将?.length ? `天将 ${interpretation.依据.天将.join("/")}` : "",
        interpretation.依据?.六亲?.length ? `六亲 ${interpretation.依据.六亲.join("/")}` : "",
      ].filter(Boolean),
    [interpretation],
  );

  const zongduan = useMemo(
    () => wrap(`总断：${interpretation.结论.总断}`, 24, 4),
    [interpretation],
  );
  const jianyi = useMemo(() => wrap(`建议：${interpretation.结论.建议}`, 24, 5), [interpretation]);

  return (
    <div className="space-y-2">
      <svg
        ref={svgRef}
        role="img"
        aria-label={`占卜结果分享图：${interpretation.卦象}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        height={HEIGHT}
        style={{ fontFamily: `"Kaiti SC","STKaiti","KaiTi","LXGW WenKai","Noto Serif SC",serif` }}
        className="w-full max-w-[320px] mx-auto block"
      >
        <rect width={WIDTH} height={HEIGHT} fill={INK} />
        <rect
          x={16}
          y={16}
          width={WIDTH - 32}
          height={HEIGHT - 32}
          rx={8}
          fill="none"
          stroke={ASH}
          strokeOpacity={0.5}
          strokeWidth={1}
        />

        <text
          x={WIDTH / 2}
          y={64}
          textAnchor="middle"
          fontSize={20}
          fill={VERMILION}
          letterSpacing="6"
        >
          玄 学 · 占 卜
        </text>

        <text
          x={WIDTH / 2}
          y={130}
          textAnchor="middle"
          fontSize={34}
          fill={PAPER}
          fontWeight="bold"
        >
          {interpretation.卦象}
        </text>
        <text x={WIDTH / 2} y={164} textAnchor="middle" fontSize={15} fill={ASH}>
          {interpretation.算法}
          {interpretation.吉凶 ? ` · 吉凶 ${interpretation.吉凶}` : ""} · 置信度{" "}
          {interpretation.置信度}
        </text>

        <line
          x1={40}
          y1={196}
          x2={WIDTH - 40}
          y2={196}
          stroke={ASH}
          strokeOpacity={0.5}
          strokeWidth={1}
        />

        <text x={40} y={236} fontSize={15} fill={GOLD}>
          总断
        </text>
        {zongduan.map((l, i) => (
          <text key={l} x={40} y={266 + i * 26} fontSize={16} fill={PAPER}>
            {l}
          </text>
        ))}

        <text x={40} y={zongduan.length * 26 + 292} fontSize={15} fill={GOLD}>
          建议
        </text>
        {jianyi.map((l, i) => (
          <text key={l} x={40} y={zongduan.length * 26 + 322 + i * 26} fontSize={16} fill={PAPER}>
            {l}
          </text>
        ))}

        {facts.length > 0 && (
          <text x={40} y={zongduan.length * 26 + jianyi.length * 26 + 336} fontSize={13} fill={ASH}>
            {facts.join(" · ")}
          </text>
        )}
        {interpretation.出处 && (
          <text x={40} y={zongduan.length * 26 + jianyi.length * 26 + 360} fontSize={13} fill={ASH}>
            出处：{wrap(interpretation.出处, 30, 1)[0]}
          </text>
        )}

        <text x={WIDTH / 2} y={HEIGHT - 76} textAnchor="middle" fontSize={11} fill={ASH}>
          仅供文化娱乐参考，不构成医疗/法律/财务等专业建议
        </text>
        <text x={WIDTH / 2} y={HEIGHT - 44} textAnchor="middle" fontSize={12} fill={ASH}>
          metaphysics-web · 玄学占卜
        </text>
      </svg>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-ash/30 px-3 py-1.5 text-xs text-ash transition-colors hover:border-qinghua hover:text-qinghua disabled:cursor-not-allowed disabled:opacity-60"
        >
          <IconDownload size={13} />
          {busy === "download" ? "下载中…" : "下载 PNG"}
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-ash/30 px-3 py-1.5 text-xs text-ash transition-colors hover:border-qinghua hover:text-qinghua disabled:cursor-not-allowed disabled:opacity-60"
        >
          <IconCopy size={13} />
          {busy === "copy" ? "复制中…" : "复制图片"}
        </button>
        <LiveNote className="self-center text-xs text-jade">{note}</LiveNote>
      </div>
    </div>
  );
}
