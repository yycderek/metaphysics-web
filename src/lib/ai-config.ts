import type { UserAIConfig } from "@/lib/aiTypes";

export const AI_CONFIG_STORAGE_KEY = "metaphysics-ai-config";
export const AI_CONFIG_LEGACY_STORAGE_KEY = "liuren-ai-config";

export function loadAIConfig(): UserAIConfig {
  try {
    const raw =
      localStorage.getItem(AI_CONFIG_STORAGE_KEY) ??
      localStorage.getItem(AI_CONFIG_LEGACY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserAIConfig) : {};
  } catch {
    return {};
  }
}
