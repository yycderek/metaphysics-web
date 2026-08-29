// 占卜历史（客户端 localStorage）：回看/续断此前的卦。
import type { AgentDivination } from "@/lib/agent/types";
import type { DivinationResult } from "@/lib/algorithms/types";

export interface HistoryEntry {
  id: string;
  question: string;
  卦象: string;
  interpretation: AgentDivination;
  divination?: DivinationResult;
  ts: number;
}

const STORAGE_KEY = "metaphysics-history";
const MAX = 20;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return list.filter((e) => e?.id && e?.interpretation);
  } catch {
    return [];
  }
}

export function saveHistory(list: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** 追加一条（去重 by id），最多保留 MAX 条 */
export function pushHistoryEntry(list: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...list.filter((e) => e.id !== entry.id)];
  return next.slice(0, MAX);
}

export function removeHistoryEntry(list: HistoryEntry[], id: string): HistoryEntry[] {
  return list.filter((e) => e.id !== id);
}
