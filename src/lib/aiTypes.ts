// AI Provider 共享类型（纯类型，前端/服务端都可安全 import）
export interface AIProviderConfig {
  /** OpenAI 兼容 base url，如 https://api.deepseek.com */
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/** 用户可在前端设置面板覆盖的字段（全部可选，未设则走服务端默认） */
export type UserAIConfig = Partial<AIProviderConfig>;

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  /** assistant 消息请求调用工具时的工具调用（function-calling） */
  tool_calls?: ToolCall[];
  /** tool 结果消息：回填对应的工具调用 id */
  tool_call_id?: string;
}

/** OpenAI function-calling 工具定义 */
export interface FunctionDef {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}
export interface ToolDef {
  type: "function";
  function: FunctionDef;
}
/** 模型请求调用某个工具时返回的结构 */
export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}
