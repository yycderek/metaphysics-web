"use client";
// 智能占卜 Agent 面板（多轮）：用户直接说意图 → Agent 自主决定算法/参数并调用 divinate 起课
// → 引擎精确算课 → 输出结构化断语（卦象 + 简略结论 + 逐步详细解读 + 依据）。
// 支持：澄清追问（信息不足时先问再算）、把已算的卦作为记忆复读、换时辰/参数对比。
// 交互：单一输入区 + 显式「新起一卦 / 追问此卦」模式，澄清态为独立模式；起课中以罗盘仪式呈现。
import { useRef, useState } from "react";
import AgentResultCard from "@/components/AgentResultCard";
import ChangyanReview from "@/components/ChangyanReview";
import ApiSettings from "@/components/ApiSettings";
import CastingRitual from "@/components/CastingRitual";
import { IconChat, IconSpark, IconTrigram, IconUser, IconWarning } from "@/components/icons";
import { toPriorDivination } from "@/lib/agent/divinate";
import { loadHistory, pushHistoryEntry, saveHistory } from "@/lib/history";
import { changyanStats, loadChangyan } from "@/lib/changyan";
import { detectSkill } from "@/lib/agent/skills";
import type { AgentDivination, AgentMeta } from "@/lib/agent/types";
import type { DivinationResult } from "@/lib/algorithms/types";

const STORAGE_KEY = "metaphysics-ai-config";
const LEGACY_STORAGE_KEY = "liuren-ai-config";

const EXAMPLES = ["看看我最近的事业运势", "测测我明天出行的吉凶", "帮我看看这周换工作合不合适"];
const FOLLOW_UPS = [
  "具体讲讲这个结果",
  "换个时辰/参数再占对比",
  "那换成梅花易数看看",
  "我再问一句",
];
const ALGO_OPTIONS = [
  { value: "auto", label: "自动（AI 选）" },
  { value: "daliuren", label: "大六壬" },
  { value: "xiaoliuren", label: "小六壬" },
  { value: "liuyao", label: "六爻" },
  { value: "meihua", label: "梅花易数" },
];

interface HistoryMsg {
  role: "user" | "assistant";
  content: string;
}

interface AgentTurn {
  question: string;
  clarify?: string;
  interpretation?: AgentDivination;
  divination?: DivinationResult;
  divinations?: DivinationResult[];
  entryId?: string;
  topic?: string;
  error?: string;
}

function loadAIConfig(): Record<string, unknown> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export default function DivinationAgent() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [pendingClarify, setPendingClarify] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<"new" | "follow">("new");
  const [algo, setAlgo] = useState("auto");
  const [profile, setProfile] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HistoryMsg[]>([]);
  const divinationsRef = useRef<{ summary: string; facts: string }[]>([]);

  const run = async (q?: string, fresh = false) => {
    const text = (q ?? input).trim();
    if (!text || busy) return;
    // 新起一卦：清空上下文；追问/回答澄清则保留
    if (fresh && !pendingClarify) {
      threadRef.current = [];
      divinationsRef.current = [];
    }
    setInput("");
    setBusy(true);
    setError("");
    setProgress([]);
    const controller = new AbortController();
    abortRef.current = controller;
    const milestones: string[] = [];
    try {
      const resp = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: text,
          history: threadRef.current,
          divinations: divinationsRef.current,
          profile: profile.trim() || undefined,
          algorithm: algo === "auto" ? undefined : algo,
          calibration: (() => {
            const s = changyanStats(loadChangyan());
            return { overallAcc: s.acc, verified: s.verified, byTopic: s.byTopic };
          })(),
          aiConfig: loadAIConfig(),
        }),
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(j.error ?? "请求失败");
      }
      if (!resp.body) throw new Error("无响应流");

      // 逐段解析 SSE（复用 sse.ts 的事件切分，兼容 CRLF）
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let finalized = false;

      const handleEvent = async (payload: unknown) => {
        const ev = payload as {
          type?: string;
          text?: string;
          summary?: string;
          ok?: boolean;
          kind?: "answer" | "clarify";
          question?: string;
          error?: string;
          result?: AgentDivination;
          meta?: AgentMeta;
        };
        if (ev.type === "status" && ev.text) {
          milestones.push(ev.text);
          setProgress([...milestones]);
        } else if (ev.type === "divination" && ev.summary) {
          milestones.push(`起课成功：${ev.summary}`);
          setProgress([...milestones]);
        } else if (ev.type === "error") {
          throw new Error(ev.error ?? "Agent 出错");
        } else if (ev.type === "done") {
          finalized = true;
          if (!ev.ok) throw new Error(ev.error ?? "请求失败");
          if (ev.kind === "clarify" && ev.question) {
            threadRef.current = [...threadRef.current, { role: "assistant", content: ev.question }];
            setTurns((t) => [...t, { question: text, clarify: ev.question }]);
            setPendingClarify(ev.question);
            return;
          }
          if (!ev.result) throw new Error("未返回结构化结果");
          const prior = ev.meta?.divination ? toPriorDivination(ev.meta.divination) : null;
          if (prior) divinationsRef.current = [...divinationsRef.current, prior].slice(-6);
          const recap = `${ev.result.卦象}｜${ev.result.结论.总断}`;
          threadRef.current = [
            ...threadRef.current,
            { role: "user", content: text },
            { role: "assistant", content: recap },
          ];
          const entryId = `${ev.result.卦象}-${Date.now()}`;
          const topic = detectSkill(text)?.name;
          setTurns((t) => [
            ...t,
            {
              question: text,
              interpretation: ev.result!,
              divination: ev.meta?.divination,
              divinations: ev.meta?.divinations,
              entryId,
              topic,
            },
          ]);
          setComposerMode("follow");
          // 写入历史（回看用）
          const h = {
            id: entryId,
            question: text,
            卦象: ev.result.卦象,
            interpretation: ev.result!,
            divination: ev.meta?.divination,
            divinations: ev.meta?.divinations,
            ts: Date.now(),
          };
          saveHistory(pushHistoryEntry(loadHistory(), h));
          setPendingClarify(null);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split(/\r?\n\r?\n/);
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            await handleEvent(JSON.parse(line.slice(5).trim()));
          } catch {
            /* 忽略不完整块 */
          }
        }
        if (finalized) break;
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setProgress([]);
      abortRef.current = null;
    }
  };

  const hasTurns = turns.length > 0;
  const mode: "new" | "follow" = pendingClarify ? "follow" : composerMode;
  const submit = () => run(undefined, mode === "new");
  const submitChip = (q: string) => run(q, mode === "new");

  const inputCls =
    "flex-1 bg-ink border border-ash/40 rounded-lg px-3 py-2 text-sm text-paper placeholder:text-ash/85 focus:border-gold outline-none";

  const segCls = (active: boolean) =>
    `inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
      active ? "bg-gold/15 text-gold" : "text-ash hover:text-paper"
    }`;

  return (
    <section className="rounded-xl border border-gold/40 bg-ink-2 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold text-gold">
          <IconCompassMark />
          智能占卜
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ash">直接描述问题，AI 自动起课并解卦</span>
          <ApiSettings />
        </div>
      </div>

      <div className="mb-3 space-y-2">
        {/* 澄清态：独立模式，输入框直接作答 */}
        {pendingClarify && (
          <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
            <IconChat size={15} className="mt-0.5 shrink-0" />
            <span>请先回答：{pendingClarify}</span>
          </div>
        )}

        {/* 模式切换：仅在已有卦象且非澄清态时出现 */}
        {hasTurns && !pendingClarify && (
          <div className="inline-flex rounded-lg border border-ash/30 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setComposerMode("new")}
              aria-pressed={composerMode === "new"}
              className={segCls(composerMode === "new")}
            >
              <IconSpark size={13} />
              新起一卦
            </button>
            <button
              type="button"
              onClick={() => setComposerMode("follow")}
              aria-pressed={composerMode === "follow"}
              className={segCls(composerMode === "follow")}
            >
              <IconChat size={13} />
              追问此卦
            </button>
          </div>
        )}

        <p className="text-xs text-ash/85">
          {pendingClarify
            ? "回答上面的问题，Agent 会继续为你起课。"
            : mode === "new"
              ? "写下想问的事，Agent 会为你择法起课。"
              : "就当前这一卦追问，可要求换时辰 / 参数 / 算法再对比。"}
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder={
            pendingClarify
              ? "在这里回答上面的问题…"
              : mode === "new"
                ? "把想问的事告诉我，如：这周换工作合适吗？"
                : "如：为什么三传这样断？"
          }
          className={`${inputCls} h-20 w-full resize-y`}
        />

        <div className="flex items-center gap-2">
          {mode === "new" ? (
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value)}
              aria-label="选择算法"
              className="bg-ink border border-ash/40 rounded-lg px-2 py-2 text-sm text-paper focus:border-gold outline-none"
            >
              {ALGO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="hidden text-xs text-ash sm:inline">沿用当前卦象</span>
          )}
          <button
            onClick={submit}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold px-6 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold/90 disabled:opacity-40"
          >
            {!busy && (mode === "new" ? <IconSpark size={15} /> : <IconChat size={15} />)}
            {busy ? "起课中…" : pendingClarify ? "作答并继续" : mode === "new" ? "起卦" : "追问"}
          </button>
        </div>

        {showProfile && (
          <input
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder="出生信息（可选）：如 1992-07-15 午时 男"
            className={`${inputCls} block`}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs text-ash/85">
            {mode === "new" ? "试试：" : "接着问："}
          </span>
          {(mode === "new" ? EXAMPLES : FOLLOW_UPS).map((q) => (
            <button
              key={q}
              onClick={() => submitChip(q)}
              disabled={busy}
              className="rounded-full border border-ash/40 px-3 py-1 text-xs text-ash transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
            >
              {q}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowProfile((s) => !s)}
            aria-expanded={showProfile}
            className="inline-flex items-center gap-1 self-center text-xs text-ash/85 transition-colors hover:text-gold"
          >
            <IconUser size={12} />
            {showProfile ? "收起出生信息" : "出生信息（可选）"}
          </button>
        </div>
      </div>

      {busy && (
        <div className="mb-3" aria-live="polite">
          <CastingRitual progress={progress.length ? progress : ["正在择法起课…"]} />
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-start gap-2 text-sm text-vermilion" role="alert">
          <IconWarning size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {turns.map((t, idx) => (
          <div key={idx} className="space-y-2">
            <div className="text-sm text-gold">问：{t.question}</div>
            {t.clarify ? (
              <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-ink px-3 py-2 text-sm text-gold">
                <IconChat size={15} className="mt-0.5 shrink-0" />
                <span>Agent 追问：{t.clarify}</span>
              </div>
            ) : t.error ? (
              <div className="text-sm text-vermilion">{t.error}</div>
            ) : t.interpretation ? (
              <AgentResultCard
                divination={t.divination}
                interpretation={t.interpretation}
                divinations={t.divinations}
                entryId={t.entryId}
                topic={t.topic}
              />
            ) : null}
          </div>
        ))}
      </div>

      <ChangyanReview />

      <p className="pt-1 text-xs text-ash/85">仅供文化娱乐参考，不构成医疗/法律/财务等专业建议。</p>
    </section>
  );
}

/** 面板标题的卦象标记 */
function IconCompassMark() {
  return (
    <span className="text-gold">
      <IconTrigram size={16} />
    </span>
  );
}
