// 应验追踪（客户端 localStorage 数据模型 + 纯函数统计）
export type ChangyanOutcome = "应验" | "未应验" | "待验证";

export interface ChangyanEntry {
  id: string;
  algorithmId: string;
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
}

function roundAcc(practiced: number, verified: number): number | null {
  return verified ? Math.round((practiced / verified) * 100) : null;
}

/** 统计：acc = 应验 / (应验+未应验) */
export function changyanStats(list: ChangyanEntry[]): ChangyanStats {
  const byAlgo: Record<string, AlgoStat & { practiced: number }> = {};
  let verified = 0;
  let practiced = 0;
  for (const e of list) {
    const a = (byAlgo[e.algorithmId] ??= { total: 0, verified: 0, practiced: 0, acc: null });
    a.total += 1;
    if (e.outcome === "应验" || e.outcome === "未应验") {
      verified += 1;
      a.verified += 1;
      if (e.outcome === "应验") {
        practiced += 1;
        a.practiced += 1;
      }
    }
  }
  const algoClean: Record<string, AlgoStat> = {};
  for (const [k, v] of Object.entries(byAlgo)) {
    algoClean[k] = { total: v.total, verified: v.verified, acc: roundAcc(v.practiced, v.verified) };
  }
  return { total: list.length, verified, acc: roundAcc(practiced, verified), byAlgo: algoClean };
}
