// AI Provider 配置解析测试（阶段1 + 2026-08-26 通用命名）
// 覆盖 resolveAIConfig 优先级：用户设置 > env AI_* > env DEEPSEEK_* > 内置默认
import { describe, it, expect, afterEach } from "vitest";
import { resolveAIConfig, resolveApiKey } from "./aiProvider";

const ENV_KEYS = ["AI_API_KEY", "AI_BASE_URL", "AI_MODEL", "DEEPSEEK_API_KEY", "DEEPSEEK_BASE_URL", "DEEPSEEK_MODEL"];

afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});

describe("resolveAIConfig 优先级", () => {
  it("用户设置 > 一切环境变量", () => {
    process.env.AI_API_KEY = "env-ai-key";
    process.env.DEEPSEEK_API_KEY = "env-ds-key";
    const cfg = resolveAIConfig({
      baseUrl: "https://my-provider.example.com",
      apiKey: "user-key",
      model: "my-model",
      temperature: 1.2,
    });
    expect(cfg.baseUrl).toBe("https://my-provider.example.com");
    expect(cfg.apiKey).toBe("user-key");
    expect(cfg.model).toBe("my-model");
    expect(cfg.temperature).toBe(1.2);
  });

  it("无用户设置时：AI_* 环境变量优先于 DEEPSEEK_*", () => {
    process.env.AI_API_KEY = "env-ai-key";
    process.env.AI_BASE_URL = "https://ai.example.com";
    process.env.AI_MODEL = "ai-model";
    process.env.DEEPSEEK_API_KEY = "env-ds-key";
    process.env.DEEPSEEK_BASE_URL = "https://ds.example.com";
    const cfg = resolveAIConfig();
    expect(cfg.apiKey).toBe("env-ai-key");
    expect(cfg.baseUrl).toBe("https://ai.example.com");
    expect(cfg.model).toBe("ai-model");
  });

  it("无 AI_* 时兼容旧名 DEEPSEEK_*", () => {
    process.env.DEEPSEEK_API_KEY = "env-ds-key";
    process.env.DEEPSEEK_BASE_URL = "https://ds.example.com";
    process.env.DEEPSEEK_MODEL = "ds-model";
    const cfg = resolveAIConfig();
    expect(cfg.apiKey).toBe("env-ds-key");
    expect(cfg.baseUrl).toBe("https://ds.example.com");
    expect(cfg.model).toBe("ds-model");
  });

  it("全部缺省时回退内置默认（deepseek）", () => {
    const cfg = resolveAIConfig();
    expect(cfg.baseUrl).toBe("https://api.deepseek.com");
    expect(cfg.model).toBe("deepseek-v4-flash");
    expect(cfg.temperature).toBe(0.7);
  });
});

describe("resolveApiKey 环境变量优先级", () => {
  it("AI_API_KEY 优先于 DEEPSEEK_API_KEY", () => {
    process.env.AI_API_KEY = "env-ai-key";
    process.env.DEEPSEEK_API_KEY = "env-ds-key";
    expect(resolveApiKey()).toBe("env-ai-key");
  });

  it("仅 DEEPSEEK_API_KEY 时兼容返回", () => {
    process.env.DEEPSEEK_API_KEY = "env-ds-key";
    expect(resolveApiKey()).toBe("env-ds-key");
  });

  it("均缺省时读 ~/.hermes/.env（本机开发环境存在）或返回空串", () => {
    const key = resolveApiKey();
    expect(typeof key).toBe("string");
  });
});
