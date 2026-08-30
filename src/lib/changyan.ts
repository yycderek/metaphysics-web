// 应验追踪（客户端 localStorage 数据模型 + 纯函数统计）
export type ChangyanOutcome = "应验" | "未应验" | "待验证";

export interface ChangyanEntry {
  id: string;
  algorithmId: string;
  /** 问事事类（技能路由名，如 事业部 / 感情·婚姻），用于按事类复盘 */
  topic?: string;
  卦象: string;
  总结: string;
  outcome: ChangyanOutcome;
  ts: number;
}

const STORAGE_KEY = "metaphysics-changyan";

export function loadChangyan(): ChangyanEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as ChangyanEntry[]) : [];
    return list.filter((e) => e?.id);
  } catch {
    return [];
  }
}

export function saveChangyan(list: ChangyanEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** 以 id 去重：有则更新，无则追加（最多保留 max 条） */
export function upsertChangyan(
  list: ChangyanEntry[],
  entry: ChangyanEntry,
  max = 200,
): ChangyanEntry[] {
  const idx = list.findIndex((e) => e.id === entry.id);
  const next = idx >= 0 ? [...list.slice(0, idx), entry, ...list.slice(idx + 1)] : [entry, ...list];
  return next.slice(0, max);
}

export interface AlgoStat {
  total: number;
  verified: number;
  acc: number | null; // 已验证准确率 0-100
}
export interface ChangyanStats {
  total: number;
  verified: number;
  acc: number | null;
  byAlgo: Record<string, AlgoStat>;
  byTopic: Record<string, AlgoStat>;
}

function roundAcc(practiced: number, verified: number): number | null {
  return verified ? Math.round((practiced / verified) * 100) : null;
}

/** 统计：acc = 应验 / (应验+未应验)；同时按算法与事类分组 */
export function changyanStats(list: ChangyanEntry[]): ChangyanStats {
  const byAlgo: Record<string, AlgoStat & { practiced: number }> = {};
  const byTopic: Record<string, AlgoStat & { practiced: number }> = {};
  let verified = 0;
  let practiced = 0;
  const inc = (
    bucket: Record<string, AlgoStat & { practiced: number }>,
    key: string,
    ev: ChangyanEntry,
  ) => {
    const a = (bucket[key] ??= { total: 0, verified: 0, practiced: 0, acc: null });
    a.total += 1;
    if (ev.outcome === "应验" || ev.outcome === "未应验") {
      a.verified += 1;
      if (ev.outcome === "应验") a.practiced += 1;
    }
  };
  for (const e of list) {
    inc(byAlgo, e.algorithmId, e);
    inc(byTopic, e.topic || "未分类", e);
    if (e.outcome === "应验" || e.outcome === "未应验") {
      verified += 1;
      if (e.outcome === "应验") practiced += 1;
    }
  }
  const clean = (b: Record<string, AlgoStat & { practiced: number }>): Record<string, AlgoStat> => {
    const out: Record<string, AlgoStat> = {};
    for (const [k, v] of Object.entries(b))
      out[k] = { total: v.total, verified: v.verified, acc: roundAcc(v.practiced, v.verified) };
    return out;
  };
  return {
    total: list.length,
    verified,
    acc: roundAcc(practiced, verified),
    byAlgo: clean(byAlgo),
    byTopic: clean(byTopic),
  };
}

/** 可靠性分级 */
export function reliability(acc: number | null): { label: string; tone: "ok" | "mid" | "low" } {
  if (acc == null) return { label: "样本不足", tone: "low" };
  if (acc >= 75) return { label: "可靠", tone: "ok" };
  if (acc >= 50) return { label: "中等", tone: "mid" };
  return { label: "谨慎", tone: "low" };
}
