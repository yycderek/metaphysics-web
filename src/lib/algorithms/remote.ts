// 远程算法服务适配器（阶段4）
// 协议：POST {input} → 200 JSON DivinationResult
// 任意语言/平台实现（Python/Node/云函数均可），平台只负责调用与校验
import type { AlgorithmAdapter, AlgorithmInput, DivinationResult } from "./types";

export interface RemoteServiceConfig {
  id: string; // 适配器 id（唯一，如 'xiaoliuren'）
  name: string; // 展示名
  url: string; // HTTP 端点（POST）
}

const REQUEST_TIMEOUT_MS = 15000;

/** 校验远程返回是否合法 DivinationResult */
function isDivinationResult(v: unknown): v is DivinationResult {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.algorithmId === "string" &&
    typeof r.algorithmName === "string" &&
    typeof r.input === "object" &&
    Array.isArray(r.steps)
  );
}

/** 由远程服务配置构造适配器（客户端注册用） */
export function createRemoteAdapter(cfg: RemoteServiceConfig): AlgorithmAdapter {
  const { id, name, url } = cfg;
  return {
    id,
    name,
    description: `远程算法服务：${url}`,

    parseInput(input: AlgorithmInput) {
      // 键值全部为字符串/数字即视为合法，具体校验交给远程服务
      const ok = Object.values(input).every((v) => typeof v === "string" || typeof v === "number");
      return ok ? input : null;
    },

    async build(input: AlgorithmInput): Promise<DivinationResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let resp: Response;
      try {
        resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
          signal: controller.signal,
        });
      } catch (e) {
        throw new Error(
          `远程算法 ${name} 不可达（${url}）: ${e instanceof Error && e.name === "AbortError" ? "请求超时(15s)" : (e as Error).message}`,
        );
      } finally {
        clearTimeout(timer);
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`远程算法 ${name} 返回 HTTP ${resp.status}: ${text.slice(0, 200)}`);
      }

      let json: unknown;
      try {
        json = await resp.json();
      } catch {
        throw new Error(`远程算法 ${name} 返回非 JSON 响应`);
      }

      if (!isDivinationResult(json)) {
        throw new Error(
          `远程算法 ${name} 响应格式不合法：需要 { algorithmId, algorithmName, input, steps, raw }`,
        );
      }
      return json;
    },
  };
}
