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
  role: "system" | "user" | "assistant";
  content: string;
}
