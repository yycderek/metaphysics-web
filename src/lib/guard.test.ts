// baseUrl 白名单（防 SSRF）测试：严格 origin 匹配 + 未配置时默认行为
import { describe, it, expect, afterEach } from "vitest";
import { baseUrlAllowed } from "./guard";
import { DEFAULT_BASE_URL } from "./aiProvider";

afterEach(() => {
  delete process.env.ALLOW_BASE_URLS;
});

describe("baseUrlAllowed 未配置 ALLOW_BASE_URLS", () => {
  it("未传 baseUrl → 放行（走服务端默认配置）", () => {
    expect(baseUrlAllowed(undefined)).toBe(true);
    expect(baseUrlAllowed("")).toBe(true);
  });

  it("内置默认 baseUrl → 放行", () => {
    expect(baseUrlAllowed(DEFAULT_BASE_URL)).toBe(true);
    // 带路径/尾斜杠仍为同一 origin
    expect(baseUrlAllowed(`${DEFAULT_BASE_URL}/v1`)).toBe(true);
  });

  it("任意其他 URL → 拒绝", () => {
    expect(baseUrlAllowed("https://evil.com")).toBe(false);
    expect(baseUrlAllowed("http://169.254.169.254/latest/meta-data")).toBe(false);
  });

  it("子串绕过用例：查询串藏允许域名 → 拒绝", () => {
    expect(baseUrlAllowed(`https://evil.com/?x=${new URL(DEFAULT_BASE_URL).host}`)).toBe(false);
    expect(baseUrlAllowed("https://evil.com/?x=allowed.com")).toBe(false);
  });

  it("非法 URL → 拒绝", () => {
    expect(baseUrlAllowed("not-a-url")).toBe(false);
    expect(baseUrlAllowed("ftp://api.deepseek.com")).toBe(false);
  });
});

describe("baseUrlAllowed 配置白名单后", () => {
  it("origin 完全一致（含路径）→ 放行", () => {
    process.env.ALLOW_BASE_URLS = "https://api.example.com, https://other.com:8443";
    expect(baseUrlAllowed("https://api.example.com")).toBe(true);
    expect(baseUrlAllowed("https://api.example.com/v1/chat")).toBe(true);
    expect(baseUrlAllowed("https://other.com:8443")).toBe(true);
  });

  it("origin 不同则拒绝：端口/协议/子域名差异都算", () => {
    process.env.ALLOW_BASE_URLS = "https://api.example.com";
    expect(baseUrlAllowed("https://api.example.com:8443")).toBe(false);
    expect(baseUrlAllowed("http://api.example.com")).toBe(false);
    expect(baseUrlAllowed("https://sub.api.example.com")).toBe(false);
    expect(baseUrlAllowed("https://api.example.com.evil.com")).toBe(false);
  });

  it("配置白名单后默认 baseUrl 不再隐式放行", () => {
    process.env.ALLOW_BASE_URLS = "https://api.example.com";
    expect(baseUrlAllowed(DEFAULT_BASE_URL)).toBe(false);
  });

  it("绕过用例：前缀相同但主机不同 → 拒绝", () => {
    process.env.ALLOW_BASE_URLS = "https://allowed.com";
    expect(baseUrlAllowed("https://allowed.com.evil.com/path")).toBe(false);
    expect(baseUrlAllowed("https://evil.com/?x=allowed.com")).toBe(false);
    expect(baseUrlAllowed("https://allowed.com@evil.com")).toBe(false);
  });

  it("白名单项本身非法 → 跳过不误放行", () => {
    process.env.ALLOW_BASE_URLS = "not-a-url";
    expect(baseUrlAllowed("https://not-a-url.com")).toBe(false);
  });
});
