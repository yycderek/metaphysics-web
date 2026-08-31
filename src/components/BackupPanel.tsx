"use client";
// 本地数据备份：导出/导入「历史 + 应验」为 JSON 文件（换设备/防丢失，无需账号）。
import { useState } from "react";
import { loadHistory, saveHistory, type HistoryEntry } from "@/lib/history";
import { loadChangyan, saveChangyan, type ChangyanEntry } from "@/lib/changyan";

const dateStr = () => new Date().toISOString().slice(0, 10);

export default function BackupPanel() {
  const [note, setNote] = useState("");

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

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { history?: HistoryEntry[]; changyan?: ChangyanEntry[] };
      if (!Array.isArray(data.history) || !Array.isArray(data.changyan)) {
        setNote("文件格式不对（缺少 history / changyan）");
        return;
      }
      saveHistory(data.history);
      saveChangyan(data.changyan);
      setNote("已导入，刷新后生效");
    } catch {
      setNote("文件解析失败");
    }
  };

  const inputCls = "text-xs text-ash hover:text-gold transition-colors";

  return (
    <div className="text-xs">
      <span className="text-ash/70 mr-2">数据备份：</span>
      <button type="button" onClick={exportJson} className={inputCls}>
        导出
      </button>
      <label className={`${inputCls} ml-3 cursor-pointer`}>
        导入
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importJson(f);
            e.target.value = "";
          }}
        />
      </label>
      {note && <span className="text-jade ml-2">{note}</span>}
    </div>
  );
}
