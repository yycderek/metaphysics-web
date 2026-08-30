"use client";
// 算法输入表单：算法选择（内置）+ 各算法友好输入；大六壬→干支，小六壬→月日时，六爻→摇卦，梅花→报数。
import { useState } from "react";
import { DIZHI, TIANGAN, YUEJIANG_NAME, shizhiFromHour } from "@/lib/data";
import { rizhuFromDate } from "@/lib/calendar";
import type { AlgorithmAdapter, AlgorithmInput } from "@/lib/algorithms/types";

interface Props {
  adapters: AlgorithmAdapter[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDivine: (input: AlgorithmInput) => Promise<void>;
}

const DEFAULT = { rizhu: "庚子", shizhi: "午", yuejiang: "亥" };

/** 六爻摇掷：随机 6 个（6/7/8/9） */
function randomTosses(): string {
  return Array.from({ length: 6 }, () => 6 + Math.floor(Math.random() * 4)).join(",");
}

const numCls =
  "bg-ink-2 border border-ash/40 rounded-lg px-3 py-2 text-paper text-sm focus:border-gold outline-none";

const inputCls =
  "bg-ink-2 border border-ash/40 rounded-lg px-3 py-2 text-paper text-sm focus:border-gold outline-none";

export default function DivineForm({ adapters, selectedId, onSelect, onDivine }: Props) {
  const [gan, setGan] = useState(DEFAULT.rizhu[0]);
  const [zhi, setZhi] = useState(DEFAULT.rizhu[1]);
  const [shizhi, setShizhi] = useState(DEFAULT.shizhi);
  const [yuejiang, setYuejiang] = useState(DEFAULT.yuejiang);
  const [jsonInput, setJsonInput] = useState("");
  // 各算法友好输入
  const [xlMonth, setXlMonth] = useState("3");
  const [xlDay, setXlDay] = useState("18");
  const [xlHour, setXlHour] = useState("7");
  const [yaoTosses, setYaoTosses] = useState(() => randomTosses());
  const [mh1, setMh1] = useState("3");
  const [mh2, setMh2] = useState("7");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isDaliuren = selectedId === "daliuren";

  const useNow = () => {
    const now = new Date();
    const rz = rizhuFromDate(now);
    setGan(rz[0]);
    setZhi(rz[1]);
    setShizhi(shizhiFromHour(now.getHours()));
    setError("");
  };

  const divine = async () => {
    try {
      let input: AlgorithmInput;
      if (isDaliuren) {
        input = { rizhu: gan + zhi, shizhi, yuejiang };
      } else if (selectedId === "xiaoliuren") {
        input = { month: Number(xlMonth), day: Number(xlDay), hour: Number(xlHour) };
      } else if (selectedId === "liuyao") {
        input = { tosses: yaoTosses };
      } else if (selectedId === "meihua") {
        input = { num1: Number(mh1), num2: Number(mh2) };
      } else {
        const parsed: unknown = JSON.parse(jsonInput || "{}");
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error('JSON 输入必须是对象，如 {"month": 3}');
        }
        input = parsed as AlgorithmInput;
      }
      setError("");
      setBusy(true);
      await onDivine(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const selectCls = inputCls;

  return (
    <div className="rounded-xl border border-ash/30 bg-ink-2 p-4 space-y-4">
      {/* 算法选择 */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs text-ash mb-1">算法</div>
          <select
            className={selectCls}
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
          >
            {adapters.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        {!isDaliuren && <span className="text-xs text-ash py-2">按提示填写即可</span>}
      </div>

      {/* 输入区 */}
      {isDaliuren ? (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs text-ash mb-1">日干</div>
            <select className={selectCls} value={gan} onChange={(e) => setGan(e.target.value)}>
              {TIANGAN.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-ash mb-1">日支</div>
            <select className={selectCls} value={zhi} onChange={(e) => setZhi(e.target.value)}>
              {DIZHI.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-ash mb-1">时支</div>
            <select
              className={selectCls}
              value={shizhi}
              onChange={(e) => setShizhi(e.target.value)}
            >
              {DIZHI.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-ash mb-1">月将</div>
            <select
              className={selectCls}
              value={yuejiang}
              onChange={(e) => setYuejiang(e.target.value)}
            >
              {DIZHI.map((d) => (
                <option key={d} value={d}>
                  {d}·{YUEJIANG_NAME[d]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={useNow}
            className="rounded-lg border border-ash/40 px-3 py-2 text-sm text-ash hover:text-paper hover:border-gold transition-colors"
          >
            ⌚ 当前时间
          </button>
        </div>
      ) : selectedId === "xiaoliuren" ? (
        <div className="flex flex-wrap items-end gap-3">
          {(["月", "日", "时"] as const).map((label, i) => (
            <div key={label}>
              <div className="text-xs text-ash mb-1">{label}</div>
              <input
                type="number"
                min={1}
                max={30}
                className={`${numCls} w-20`}
                value={[xlMonth, xlDay, xlHour][i]}
                onChange={(e) =>
                  i === 0
                    ? setXlMonth(e.target.value)
                    : i === 1
                      ? setXlDay(e.target.value)
                      : setXlHour(e.target.value)
                }
              />
            </div>
          ))}
          <span className="text-xs text-ash pb-2">月/日/时（1-30 整数）</span>
        </div>
      ) : selectedId === "liuyao" ? (
        <div>
          <div className="text-xs text-ash mb-1">
            六爻 · 铜钱摇卦（6 个值，6=老阴 7=少阳 8=少阴 9=老阳）
          </div>
          <div className="flex gap-2">
            <input
              className={`${inputCls} font-mono flex-1`}
              value={yaoTosses}
              onChange={(e) => setYaoTosses(e.target.value)}
              placeholder="如 7,7,7,7,7,7"
            />
            <button
              type="button"
              onClick={() => setYaoTosses(randomTosses())}
              className="rounded-lg border border-ash/40 px-3 py-2 text-sm text-ash hover:text-paper transition-colors"
            >
              🎲 随机摇卦
            </button>
          </div>
        </div>
      ) : selectedId === "meihua" ? (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs text-ash mb-1">报数一</div>
            <input
              type="number"
              min={1}
              className={`${numCls} w-20`}
              value={mh1}
              onChange={(e) => setMh1(e.target.value)}
            />
          </div>
          <div>
            <div className="text-xs text-ash mb-1">报数二</div>
            <input
              type="number"
              min={1}
              className={`${numCls} w-20`}
              value={mh2}
              onChange={(e) => setMh2(e.target.value)}
            />
          </div>
          <span className="text-xs text-ash pb-2">两个正整数（报数起卦）</span>
        </div>
      ) : (
        <div>
          <div className="text-xs text-ash mb-1">输入参数（JSON）</div>
          <textarea
            className={`${inputCls} w-full font-mono h-28 resize-y`}
            placeholder={'{\n  "key": "value"\n}'}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <p className="text-xs text-ash/70 mt-1">远程/自定义算法需按协议传入 JSON。</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={divine}
          disabled={busy}
          className="rounded-lg bg-gold px-6 py-2 text-sm font-bold text-ink hover:bg-gold/90 transition-colors disabled:opacity-40"
        >
          {busy ? "起课中…" : "起课"}
        </button>
        {error && <div className="text-sm text-vermilion flex-1">{error}</div>}
      </div>
    </div>
  );
}
