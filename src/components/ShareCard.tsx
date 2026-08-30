"use client";
// 分享卡：把卦象 + 断语渲染成一张玄学风竖版图（SVG），可下载 PNG 或复制到剪贴板。
import { useRef, useState } from "react";
import type { AgentDivination } from "@/lib/agent/types";

interface Props {
  interpretation: AgentDivination;
}

const WIDTH = 620;
const HEIGHT = 820;
const GOLD = "#7ea6c6"; // 月白蓝
const PAPER = "#e6ecec"; // 青白
const ASH = "#8796a0";
const INK = "#0d1114"; // 玄青墨

/** 按每行字数折行，超出上限截断 */
function wrap(text: string, per: number, maxLines: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length && lines.length < maxLines; i += per) {
    lines.push(text.slice(i, i + per));
  }
  return lines;
}

async function svgToPng(svg: SVGSVGElement): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg);
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

  const download = async () => {
    if (!svgRef.current) return;
    try {
      const blob = await svgToPng(svgRef.current);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `占卜-${interpretation.卦象}.png`;
      a.click();
      // 延后释放，避免浏览器读取前 URL 已被回收导致下载失败
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setNote("已下载");
    } catch (e) {
      setNote((e as Error).message);
    }
  };

  const copy = async () => {
    if (!svgRef.current) return;
    try {
      const blob = await svgToPng(svgRef.current);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setNote("已复制图片");
    } catch (e) {
      setNote((e as Error).message);
    }
  };

  const facts = [
    interpretation.依据?.三传?.length ? `三传 ${interpretation.依据.三传.join("→")}` : "",
    interpretation.依据?.天将?.length ? `天将 ${interpretation.依据.天将.join("/")}` : "",
    interpretation.依据?.六亲?.length ? `六亲 ${interpretation.依据.六亲.join("/")}` : "",
  ].filter(Boolean);

  const zongduan = wrap(`总断：${interpretation.结论.总断}`, 24, 4);
  const jianyi = wrap(`建议：${interpretation.结论.建议}`, 24, 5);

  return (
    <div className="space-y-2">
      <svg
        ref={svgRef}
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
          rx={18}
          fill="none"
          stroke={GOLD}
          strokeWidth={2}
        />

        <text x={WIDTH / 2} y={64} textAnchor="middle" fontSize={20} fill={GOLD} letterSpacing="6">
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
          stroke={GOLD}
          strokeOpacity={0.5}
          strokeWidth={1}
        />

        <text x={40} y={236} fontSize={15} fill={GOLD}>
          总断
        </text>
        {zongduan.map((l, i) => (
          <text key={`z${i}`} x={40} y={266 + i * 26} fontSize={16} fill={PAPER}>
            {l}
          </text>
        ))}

        <text x={40} y={zongduan.length * 26 + 292} fontSize={15} fill={GOLD}>
          建议
        </text>
        {jianyi.map((l, i) => (
          <text
            key={`j${i}`}
            x={40}
            y={zongduan.length * 26 + 322 + i * 26}
            fontSize={16}
            fill={PAPER}
          >
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

        <text x={WIDTH / 2} y={HEIGHT - 44} textAnchor="middle" fontSize={12} fill={ASH}>
          metaphysics-web · 可复现引擎起课
        </text>
      </svg>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={download}
          className="rounded-lg border border-ash/40 px-3 py-1.5 text-xs text-ash hover:text-gold hover:border-gold transition-colors"
        >
          ⬇ 下载 PNG
        </button>
        <button
          onClick={copy}
          className="rounded-lg border border-ash/40 px-3 py-1.5 text-xs text-ash hover:text-gold hover:border-gold transition-colors"
        >
          📋 复制图片
        </button>
        {note && <span className="text-xs text-jade self-center">{note}</span>}
      </div>
    </div>
  );
}
