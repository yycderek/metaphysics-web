// AI 端点防护：per-IP 限流 + 可选 API Key + baseUrl 白名单（防 SSRF/开放代理）。
import { NextRequest } from "next/server";
import { rateLimit } from "./ratelimit";
import { DEFAULT_BASE_URL } from "./aiProvider";

const APP_API_KEY = process.env.APP_API_KEY;

/** 白名单惰性读取（env 可能在运行期/测试中变更） */
function allowedBaseUrls(): string[] {
  return (process.env.ALLOW_BASE_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function clientIp(req: NextRequest): string {
  // 注意：x-forwarded-for / x-real-ip 均可被客户端伪造，仅作软限流依据；
  // 生产环境应在部署层（反代/网关）覆写或提取真实 IP，不要信任请求自带值。
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "local";
}

export interface GuardResult {
  ok: boolean;
  /** ok 为 false 时应返回的响应体 */
  body?: { ok: boolean; error: string };
  status?: number;
}

/** 综合防护：先 key 校验（若配置），再限流。*/
export function guardAI(req: NextRequest, perMin = 30, perDay = 300): GuardResult {
  if (APP_API_KEY) {
    const key = req.headers.get("x-api-key");
    if (key !== APP_API_KEY) {
      return {
        ok: false,
        body: { ok: false, error: "缺少或错误的 API Key（x-api-key）" },
        status: 401,
      };
    }
  }
  const rl = rateLimit(`ai:${clientIp(req)}`, perMin, perDay);
  if (!rl.ok) {
    return { ok: false, body: { ok: false, error: `请求过于频繁：${rl.limit}` }, status: 429 };
  }
  return { ok: true };
}

/**
 * 用户自定义 baseUrl 是否被允许（严格 origin 比较，防子串绕过）。
 * 未配置 ALLOW_BASE_URLS 时仅放行内置默认 baseUrl；配置了则严格按白名单。
 * URL 解析失败一律拒绝。
 */
export function baseUrlAllowed(userBaseUrl?: string): boolean {
  if (!userBaseUrl) return true;
  let origin: string;
  try {
    origin = new URL(userBaseUrl).origin;
  } catch {
    return false;
  }
  if (origin === "null") return false; // 非 http(s) 等非常规 scheme
  const allowlist = allowedBaseUrls();
  const allowed = allowlist.length ? allowlist : [DEFAULT_BASE_URL];
  return allowed.some((a) => {
    try {
      return new URL(a).origin === origin;
    } catch {
      return false;
    }
  });
}

/** 把 GuardResult 转成 Next 响应（ok=false 时） */
export function guardResponse(g: GuardResult): Response | null {
  if (g.ok) return null;
  return Response.json(g.body ?? { ok: false, error: "拒绝" }, { status: g.status ?? 403 });
}
