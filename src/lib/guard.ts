// AI 端点防护：per-IP 限流 + 可选 API Key + baseUrl 白名单（防 SSRF/开放代理）。
import { NextRequest } from "next/server";
import { rateLimit } from "./ratelimit";

const APP_API_KEY = process.env.APP_API_KEY;
const ALLOWED_BASE_URLS = (process.env.ALLOW_BASE_URLS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function clientIp(req: NextRequest): string {
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

/** 用户自定义 baseUrl 是否被允许（未配置白名单则允许；配置了则必须匹配） */
export function baseUrlAllowed(userBaseUrl?: string): boolean {
  if (!userBaseUrl) return true;
  if (!ALLOWED_BASE_URLS.length) return true;
  return ALLOWED_BASE_URLS.some((a) => userBaseUrl.startsWith(a) || userBaseUrl.includes(a));
}

/** 把 GuardResult 转成 Next 响应（ok=false 时） */
export function guardResponse(g: GuardResult): Response | null {
  if (g.ok) return null;
  return Response.json(g.body ?? { ok: false, error: "拒绝" }, { status: g.status ?? 403 });
}
