// 自校验（self-verification）：把断语引用的卦理事实与引擎算出的真实事实逐项比对。
// 只针对大六壬（引擎有明确的三传/天将/六亲可核验）；其他算法或不含"依据"时跳过（不误判）。
import type { DivinationResult } from "@/lib/algorithms/types";
import type { AgentDivination } from "./types";
import { divinationFacts } from "./divinate";
import { TIANJIANG_FULL } from "@/lib/data";

export interface VerifyResult {
  ok: boolean;
  mismatch?: string;
}

function normalizeTianjiang(value: string): string {
  // 接受全称（玄武）或简称（武）；统一成简称比对
  for (const [short, full] of Object.entries(TIANJIANG_FULL)) {
    if (value === full || value === short) return short;
  }
  return value;
}

function eq(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** 校验断语引用的事实是否与引擎一致 */
export function verifyDivination(
  divination: DivinationResult,
  interpretation: AgentDivination,
): VerifyResult {
  if (divination.algorithmId !== "daliuren") return { ok: true };
  const stated = interpretation.依据;
  if (!stated) return { ok: true }; // 未声明依据，无从校验，跳过
  const engine = divinationFacts(divination);
  const problems: string[] = [];

  if (stated.三传?.length && !eq(stated.三传, engine.三传 ?? [])) {
    problems.push(`三传引擎为 ${(engine.三传 ?? []).join("→")}，你引为 ${stated.三传.join("→")}`);
  }
  if (
    stated.天将?.length &&
    !eq(stated.天将.map(normalizeTianjiang), (engine.天将 ?? []).map(normalizeTianjiang))
  ) {
    problems.push(`天将引擎为 ${(engine.天将 ?? []).join("/")}，你引为 ${stated.天将.join("/")}`);
  }
  if (stated.六亲?.length && !eq(stated.六亲, engine.六亲 ?? [])) {
    problems.push(`六亲引擎为 ${(engine.六亲 ?? []).join("/")}，你引为 ${stated.六亲.join("/")}`);
  }
  // 校验引用是否为空（不校验）已由上面覆盖
  if (problems.length) return { ok: false, mismatch: problems.join("；") };
  return { ok: true };
}
