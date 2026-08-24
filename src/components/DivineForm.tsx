"use client";
// 算法输入表单（阶段4）：
// - 算法选择下拉（内置大六壬 + 用户注册的远程算法/本地插件）
// - 大六壬 → 日柱/时支/月将选择；其他算法 → JSON 输入
// - 远程算法服务管理（名称/URL 增删，localStorage 持久化）
import { useState } from "react";
import { DIZHI, TIANGAN, YUEJIANG_NAME, shizhiFromHour } from "@/lib/data";
import { rizhuFromDate } from "@/lib/calendar";
import type { AlgorithmAdapter, AlgorithmInput } from "@/lib/algorithms/types";
import type { RemoteServiceConfig } from "@/lib/algorithms/remote";

interface Props {
  adapters: AlgorithmAdapter[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDivine: (input: AlgorithmInput) => Promise<void>;
  services: RemoteServiceConfig[];
  onServicesChange: (services: RemoteServiceConfig[]) => void;
}

const DEFAULT = { rizhu: "庚子", shizhi: "午", yuejiang: "亥" };

const inputCls =
  "bg-ink-2 border border-ash/40 rounded-lg px-3 py-2 text-paper text-sm focus:border-gold outline-none";

export default function DivineForm({
  adapters,
  selectedId,
  onSelect,
  onDivine,
  services,
  onServicesChange,
}: Props) {
  const [gan, setGan] = useState(DEFAULT.rizhu[0]);
  const [zhi, setZhi] = useState(DEFAULT.rizhu[1]);
  const [shizhi, setShizhi] = useState(DEFAULT.shizhi);
  const [yuejiang, setYuejiang] = useState(DEFAULT.yuejiang);
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 远程服务管理表单
  const [showServices, setShowServices] = useState(false);
  const [sName, setSName] = useState("");
  const [sUrl, setSUrl] = useState("");
  const [sId, setSId] = useState("");

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
      } else {
        const parsed: unknown = JSON.parse(jsonInput || "{}");
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("JSON 输入必须是对象，如 {\"month\": 3, \"day\": 18, \"question\": \"出行\"}");
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

  const addService = () => {
    const name = sName.trim();
    const url = sUrl.trim();
    const id = sId.trim() || name;
    if (!name || !url) {
      setError("远程算法需要名称和 URL");
      return;
    }
    if (!/^https?:\/\//.test(url)) {
      setError("URL 需以 http:// 或 https:// 开头");
      return;
    }
    onServicesChange([...services, { id, name, url }]);
    setSName("");
    setSUrl("");
    setSId("");
    setError("");
  };

  const removeService = (id: string) => {
    onServicesChange(services.filter((s) => s.id !== id));
  };

  const selectCls = inputCls;

  return (
    <div className="rounded-xl border border-ash/30 bg-ink-2 p-4 space-y-4">
      {/* 算法选择 + 远程管理入口 */}
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
                {a.name}（{a.id}）
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowServices((s) => !s)}
          className="rounded-lg border border-ash/40 px-3 py-2 text-sm text-ash hover:border-gold hover:text-paper transition-colors"
        >
          🔌 远程算法服务 {services.length > 0 ? `(${services.length})` : ""}
        </button>
        {!isDaliuren && (
          <span className="text-xs text-ash py-2">
            此算法输入为 JSON 对象，字段定义见算法说明
          </span>
        )}
      </div>

      {/* 远程算法服务管理 */}
      {showServices && (
        <div className="rounded-lg border border-ash/30 bg-ink p-3 space-y-3">
          <p className="text-xs text-ash/80 leading-relaxed">
            远程算法服务 = 任意 HTTP 端点（Python/Node/云函数均可）。协议：POST 请求体{" "}
            {"{"}"input": 输入对象{"}"}，响应 JSON：{"{"}"algorithmId","algorithmName","input","steps","raw"{"}"}。
            配置后无需改代码，起课表单自动出现该算法。
          </p>
          {services.length > 0 && (
            <div className="space-y-1.5">
              {services.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="text-gold w-28 truncate">{s.name}</span>
                  <span className="text-ash/70 flex-1 truncate">{s.url}</span>
                  <span className="text-ash/50 text-xs">{s.id}</span>
                  <button
                    onClick={() => removeService(s.id)}
                    className="text-xs text-vermilion hover:text-vermilion/70 border border-ash/30 rounded px-2 py-0.5"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className={inputCls} placeholder="名称（如 小六壬）" value={sName}
              onChange={(e) => setSName(e.target.value)} />
            <input className={inputCls} placeholder="id（可选，默认=名称）" value={sId}
              onChange={(e) => setSId(e.target.value)} />
            <input className={inputCls} placeholder="https://your-service.com/divine" value={sUrl}
              onChange={(e) => setSUrl(e.target.value)} />
          </div>
          <button
            onClick={addService}
            className="rounded-lg bg-gold/20 border border-gold/50 px-3 py-1.5 text-xs text-gold hover:bg-gold/30 transition-colors"
          >
            + 添加远程算法
          </button>
        </div>
      )}

      {/* 输入区 */}
      {isDaliuren ? (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs text-ash mb-1">日干</div>
            <select className={selectCls} value={gan} onChange={(e) => setGan(e.target.value)}>
              {TIANGAN.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-ash mb-1">日支</div>
            <select className={selectCls} value={zhi} onChange={(e) => setZhi(e.target.value)}>
              {DIZHI.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-ash mb-1">时支</div>
            <select className={selectCls} value={shizhi} onChange={(e) => setShizhi(e.target.value)}>
              {DIZHI.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-ash mb-1">月将</div>
            <select className={selectCls} value={yuejiang} onChange={(e) => setYuejiang(e.target.value)}>
              {DIZHI.map((d) => (
                <option key={d} value={d}>{d}·{YUEJIANG_NAME[d]}</option>
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
      ) : (
        <div>
          <div className="text-xs text-ash mb-1">输入参数（JSON）</div>
          <textarea
            className={`${inputCls} w-full font-mono h-28 resize-y`}
            placeholder={'{\n  "month": 3,\n  "day": 18,\n  "question": "出行"\n}'}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={divine}
          disabled={busy}
          className="rounded-lg bg-vermilion px-6 py-2 text-sm font-bold text-paper hover:bg-vermilion/80 transition-colors disabled:opacity-40"
        >
          {busy ? "起课中…" : "起课"}
        </button>
        {error && <div className="text-sm text-vermilion flex-1">{error}</div>}
      </div>
    </div>
  );
}
