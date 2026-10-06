// 分享链接状态：起课参数（算法 id + 输入）↔ base64url，承载于 ?d= 参数；附 URL 参数解析助手
import type { AlgorithmInput } from "@/lib/algorithms/types";

export interface ShareState {
  a: string; // 算法 id
  i: AlgorithmInput; // 起课输入
}

export type PageView = "divine" | "help" | "history";
export type ResultMode = "result" | "derive";

export function encodeShareState(state: ShareState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShareState(d: string): ShareState | null {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(d)) return null;
    const bin = atob(d.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed: unknown = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))),
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const { a, i } = parsed as Record<string, unknown>;
    if (typeof a !== "string" || !a) return null;
    if (!i || typeof i !== "object" || Array.isArray(i)) return null;
    const input: AlgorithmInput = {};
    for (const [k, v] of Object.entries(i)) {
      if (typeof v === "string" || typeof v === "number") input[k] = v;
      else return null;
    }
    return { a, i: input };
  } catch {
    return null;
  }
}

export function parseView(v: string | null): PageView {
  return v === "help" || v === "history" ? v : "divine";
}

export function parseMode(m: string | null): ResultMode {
  return m === "derive" ? "derive" : "result";
}

export function parseAdvanced(adv: string | null): boolean {
  return adv === "1";
}

export function parseAlgo(algo: string | null, validIds: string[], fallback: string): string {
  return algo && validIds.includes(algo) ? algo : fallback;
}
