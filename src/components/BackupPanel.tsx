"use client";
// 本地数据备份：导出 / 导入「历史 + 应验」为 JSON 文件（换设备 / 防丢失，无需账号）。
// 导入前先解析并预览数量，用户选择「合并」或「覆盖」，避免误操作不可逆。
import { useState } from "react";
import { IconDownload, IconWarning } from "@/components/icons";
import { loadHistory, saveHistory, type HistoryEntry } from "@/lib/history";
import { loadChangyan, saveChangyan, type ChangyanEntry } from "@/lib/changyan";

const dateStr = () => new Date().toISOString().slice(0, 10);

function mergeById<T extends { id: string; ts?: number }>(cur: T[], inc: T[]): T[] {
  const map = new Map(cur.map((e) => [e.id, e]));
  for (const e of inc) {
    const prev = map.get(e.id);
    if (!prev || (e.ts ?? 0) >= (prev.ts ?? 0)) map.set(e.id, e);
  }
  return [...map.values()].sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
}

interface Pending {
  history: HistoryEntry[];
  changyan: ChangyanEntry[];
  curHistory: number;
  curChangyan: number;
}

export default function BackupPanel() {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);

  const exportJson = () => {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      history: loadHistory(),
      changyan: loadChangyan(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metaphysics-backup-${dateStr()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNote("已导出备份文件");
  };

  const pick = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { history?: HistoryEntry[]; changyan?: ChangyanEntry[] };
      if (!Array.isArray(data.history) || !Array.isArray(data.changyan)) {
        setNote("文件格式不对（缺少 history / changyan）");
        return;
      }
      setNote("");
      setPending({
        history: data.history,
        changyan: data.changyan,
        curHistory: loadHistory().length,
        curChangyan: loadChangyan().length,
      });
    } catch {
      setNote("文件解析失败");
    }
  };

  const apply = (mode: "merge" | "replace") => {
    if (!pending) return;
    if (mode === "merge") {
      saveHistory(mergeById(loadHistory(), pending.history));
      saveChangyan(mergeById(loadChangyan(), pending.changyan));
      setNote("已合并导入");
    } else {
      saveHistory(pending.history);
      saveChangyan(pending.changyan);
      setNote("已覆盖导入");
    }
    setPending(null);
    window.setTimeout(() => setNote(""), 3000);
  };

  const actionCls = "text-xs text-ash transition-colors hover:text-gold";

  return (
    <div className="text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-ash/85">数据备份：</span>
        <button
          type="button"
          onClick={exportJson}
          className={`${actionCls} inline-flex items-center gap-1`}
        >
          <IconDownload size={12} />
          导出
        </button>
        <label className={`${actionCls} inline-flex cursor-pointer items-center gap-1`}>
          导入
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pick(f);
              e.target.value = "";
            }}
          />
        </label>
        {note && <span className="text-jade">{note}</span>}
      </div>

      {pending && (
        <div className="mt-2 space-y-2 rounded-lg border border-vermilion/40 bg-vermilion/5 p-2">
          <div className="flex items-start gap-1.5 text-vermilion">
            <IconWarning size={13} className="mt-0.5 shrink-0" />
            <span className="leading-relaxed">
              导入将改动本机数据：历史 {pending.curHistory} → {pending.history.length} 条，应验{" "}
              {pending.curChangyan} → {pending.changyan.length} 条。请选择方式。
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => apply("merge")}
              className="rounded border border-gold/50 bg-gold/15 px-2.5 py-1 text-gold hover:bg-gold/25"
            >
              合并导入
            </button>
            <button
              type="button"
              onClick={() => apply("replace")}
              className="rounded border border-vermilion/50 px-2.5 py-1 text-vermilion hover:bg-vermilion/10"
            >
              覆盖导入
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded border border-ash/40 px-2.5 py-1 text-ash hover:text-paper"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
