"use client";
// 天盘圆盘：内圈地盘（固定），外圈天盘（月将加时旋转），贵人标星
import { DIZHI } from "@/lib/data";
import type { KeShi } from "@/lib/types";

const CX = 210;
const CY = 210;
const R_OUTER = 178; // 外环
const R_TIAN = 152; // 天盘支位置
const R_DI = 100; // 地盘支位置

function pos(i: number, r: number): [number, number] {
  const ang = ((-90 + i * 30) * Math.PI) / 180;
  return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
}

export default function TianPanDisk({ ks }: { ks: KeShi }) {
  return (
    <svg viewBox="0 0 420 420" className="w-full max-w-[440px] mx-auto">
      {/* 外环 */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="#1e1914" stroke="#c9a227" strokeWidth="2" />
      <circle cx={CX} cy={CY} r={R_TIAN + 18} fill="none" stroke="#4a3f2c" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R_DI + 18} fill="none" stroke="#4a3f2c" strokeWidth="1" />
      {/* 中心 */}
      <circle cx={CX} cy={CY} r={34} fill="#221d17" stroke="#c9a227" strokeWidth="1.5" />
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="15" fill="#e8d9a8">
        {ks.yuejiang}将
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" fontSize="15" fill="#e8d9a8">
        {ks.shizhi}时
      </text>

      {/* 地盘十二支（固定） */}
      {DIZHI.map((d, i) => {
        const [x, y] = pos(i, R_DI);
        return (
          <text
            key={`di-${d}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="17"
            fill="#f0e6d0"
          >
            {d}
          </text>
        );
      })}

      {/* 天盘十二支（旋转） */}
      {DIZHI.map((d, i) => {
        const tian = ks.tianpan[d];
        const [x, y] = pos(i, R_TIAN);
        const isGui = tian === ks.guiren;
        return (
          <g key={`tian-${d}`}>
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="19"
              fontWeight={isGui ? 700 : 400}
              fill={isGui ? "#c9a227" : "#d9b98c"}
            >
              {tian}
            </text>
            {isGui && (
              <text x={x} y={y - 22} textAnchor="middle" fontSize="13" fill="#c9a227">
                ★贵
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
