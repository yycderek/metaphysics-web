// 远程算法服务配置持久化（localStorage，仅客户端可用）
import type { RemoteServiceConfig } from "./remote";

const STORAGE_KEY = "metaphysics-remote-algorithms";
const LEGACY_STORAGE_KEY = "liuren-remote-algorithms";

export function loadRemoteServices(): RemoteServiceConfig[] {
  if (typeof window === "undefined") return []; // SSR 安全
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as RemoteServiceConfig[]) : [];
    return list.filter((s) => s?.id && s?.name && s?.url);
  } catch {
    return [];
  }
}

export function saveRemoteServices(list: RemoteServiceConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.removeItem(LEGACY_STORAGE_KEY); // 迁移：清除旧键
  } catch {
    /* ignore */
  }
}
