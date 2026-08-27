// AI Provider 抽象：统一 OpenAI 兼容协议的流式对话请求
// 阶段1：OpenAI 兼容格式（DeepSeek/通义/豆包/Kimi/智谱/硅基流动/Ollama/vLLM 等）纯配置化支持
// 预留：非兼容 provider（Claude/Gemini 原生 API）后续加适配器，扩展 provider 字段即可
// 2026-08-26：环境变量改为通用命名 AI_API_KEY / AI_BASE_URL / AI_MODEL（旧 DEEPSEEK_* 兼容读取）
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AIProviderConfig, UserAIConfig, ChatMessage, ToolCall, ToolDef } from "./aiTypes";

export type { AIProviderConfig, UserAIConfig, ChatMessage, ToolCall, ToolDef };

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 8192;

/** 从 ~/.hermes/.env 读取指定变量（兼容多行注释/引号） */
function readHermesEnv(name: string): string {
  try {
    const envPath = join(homedir(), ".hermes", ".env");
    if (!existsSync(envPath)) return "";
    const content = readFileSync(envPath, "utf-8");
    const m = content.match(new RegExp(`^${name}\\s*=\\s*["']?([^"'\n]+)`, "m"));
    return m ? m[1].trim() : "";
  } catch {
    return "";
  }
}

/**
 * 读取 API key（回退链）：
 * env AI_API_KEY → env DEEPSEEK_API_KEY → ~/.hermes/.env AI_API_KEY → ~/.hermes/.env DEEPSEEK_API_KEY
 * 注意：不再读 ~/.hermes/config.yaml 的 api_key——那是火山引擎 Ark 的 key，
 * 配到 DeepSeek base_url 必然 401（旧坑，见 ROADMAP-C）。
 */
export function resolveApiKey(): string {
  if (process.env.AI_API_KEY) return process.env.AI_API_KEY;
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
  return readHermesEnv("AI_API_KEY") || readHermesEnv("DEEPSEEK_API_KEY");
}

/** 合并配置：用户设置 > 环境变量（AI_* 优先，DEEPSEEK_* 兼容）> 内置默认 */
export function resolveAIConfig(user?: UserAIConfig): AIProviderConfig {
  const envBaseUrl = process.env.AI_BASE_URL ?? process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL;
  const envModel = process.env.AI_MODEL ?? process.env.DEEPSEEK_MODEL ?? DEFAULT_MODEL;
  return {
    baseUrl: user?.baseUrl?.trim() || envBaseUrl,
    apiKey: user?.apiKey?.trim() || resolveApiKey(),
    model: user?.model?.trim() || envModel,
    temperature: user?.temperature ?? DEFAULT_TEMPERATURE,
    maxTokens: user?.maxTokens ?? DEFAULT_MAX_TOKENS,
  };
}

/** OpenAI 兼容流式对话：返回上游 Response（SSE 由调用方透传给前端解析） */
export async function streamChat(
  config: AIProviderConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<Response> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
    signal,
  });
}

/** 非流式补全（支持 function-calling）：返回 assistant 消息（content + tool_calls）。Agent 循环用 */
export async function chatCompletion(
  config: AIProviderConfig,
  messages: ChatMessage[],
  tools?: ToolDef[],
  signal?: AbortSignal,
): Promise<{ content: string; tool_calls?: ToolCall[] }> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const payload: Record<string, unknown> = {
    model: config.model,
    messages,
    stream: false,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  };
  if (tools?.length) payload.tools = tools;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
    signal,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`AI 上游错误 ${resp.status}: ${text.slice(0, 200)}`);
  }
  const json = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string | null; tool_calls?: ToolCall[] } }>;
  };
  const msg = json.choices?.[0]?.message;
  return {
    content: msg?.content ?? "",
    tool_calls: msg?.tool_calls,
  };
}
