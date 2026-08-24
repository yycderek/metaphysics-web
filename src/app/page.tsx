"use client";
// 起课工具页：算法选择 → 注册表起课 → 双模式展示（课式结果 / 推导过程）
// 阶段4：支持远程算法服务（localStorage 配置，客户端注册到注册表）
import { useEffect, useState } from "react";
import "@/plugins"; // 副作用导入：注册本地算法插件（阶段4）
import type { DivinationResult, AlgorithmInput, AlgorithmAdapter } from "@/lib/algorithms/types";
import { buildDivination, listAdapters, registerAdapter } from "@/lib/algorithms/registry";
import { DALIUREN_ID, daliurenAdapter, rawKeShi } from "@/lib/algorithms/daliuren";
import { createRemoteAdapter, type RemoteServiceConfig } from "@/lib/algorithms/remote";
import { loadRemoteServices, saveRemoteServices } from "@/lib/algorithms/storage";
import DivineForm from "@/components/DivineForm";
import KeShiHeader from "@/components/KeShiHeader";
import TianPanDisk from "@/components/TianPanDisk";
import SikeCards from "@/components/SikeCards";
import SanchuanChain from "@/components/SanchuanChain";
import AiDuanke from "@/components/AiDuanke";
import StepRenderer from "@/components/StepRenderer";
import DataTree from "@/components/DataTree";
import ThemeToggle from "@/components/ThemeToggle";
import { chuanTianjiang } from "@/lib/shike";

const GOLDEN_INPUT: AlgorithmInput = { rizhu: "庚子", shizhi: "午", yuejiang: "亥" };

type Mode = "result" | "derive";

export default function HomePage() {
  // 初始课式：大六壬黄金课例（同步构建；buildDivination 异步化后适配器直调）
  const [result, setResult] = useState<DivinationResult>(() =>
    daliurenAdapter.build(GOLDEN_INPUT) as DivinationResult,
  );
  const [mode, setMode] = useState<Mode>("result");
  const [selectedId, setSelectedId] = useState<string>(DALIUREN_ID);
  const [adapters, setAdapters] = useState<AlgorithmAdapter[]>(() => listAdapters());
  const [services, setServices] = useState<RemoteServiceConfig[]>([]);

  // 客户端加载：注册远程算法服务 + 恢复服务列表
  useEffect(() => {
    const svc = loadRemoteServices();
    setServices(svc);
    for (const s of svc) registerAdapter(createRemoteAdapter(s));
    setAdapters(listAdapters());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ks = rawKeShi(result);
  // chuanTianjiang 依赖大六壬 KeShi 结构，仅大六壬结果时计算（远程/插件算法 raw 结构不同）
  const chuan = result.algorithmId === DALIUREN_ID ? chuanTianjiang(ks) : [];

  const onDivine = async (input: AlgorithmInput) => {
    setResult(await buildDivination(selectedId, input)); // 错误向上冒泡给 DivineForm 展示
  };

  const onServicesChange = (next: RemoteServiceConfig[]) => {
    setServices(next);
    saveRemoteServices(next);
    for (const s of next) registerAdapter(createRemoteAdapter(s));
    setAdapters(listAdapters());
    if (next.every((s) => s.id !== selectedId) && selectedId !== DALIUREN_ID) {
      setSelectedId(DALIUREN_ID); // 所选算法被删除时回退大六壬
    }
  };

  const onSelect = (id: string) => {
    setSelectedId(id);
    setMode("result");
  };

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm border transition-colors ${
      active
        ? "border-gold/60 bg-gold/10 text-gold"
        : "border-ash/40 text-ash hover:border-gold hover:text-paper"
    }`;

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gold">大六壬 · 起课</h1>
          <p className="text-sm text-ash mt-1">
            月将加时 · 天地盘 · 四课 · 九宗门 · 三传 · 天将六亲
          </p>
        </div>
        <nav className="flex gap-2 text-sm items-center">
          <ThemeToggle />
          <a
            href="/"
            className="rounded-lg border border-gold/60 bg-gold/10 px-4 py-2 text-gold"
          >
            🔮 起课
          </a>
          <a
            href="/demo"
            className="rounded-lg border border-ash/40 px-4 py-2 text-ash hover:border-gold hover:text-paper transition-colors"
          >
            🎓 六步学习
          </a>
        </nav>
      </header>

      <DivineForm
        adapters={adapters}
        selectedId={selectedId}
        onSelect={onSelect}
        onDivine={onDivine}
        services={services}
        onServicesChange={onServicesChange}
      />

      {/* 双模式切换 */}
      <div className="flex gap-2">
        <button className={tabCls(mode === "result")} onClick={() => setMode("result")}>
          📊 课式结果
        </button>
        <button className={tabCls(mode === "derive")} onClick={() => setMode("derive")}>
          🧭 推导过程
        </button>
      </div>

      {mode === "result" ? (
        result.algorithmId === DALIUREN_ID ? (
          <>
            <KeShiHeader ks={ks} />

          <section className="grid md:grid-cols-2 gap-6 items-start">
            <div className="rounded-xl border border-ash/30 bg-ink-2 p-4">
              <h3 className="text-gold font-bold mb-3 text-center">天地盘</h3>
              <TianPanDisk ks={ks} />
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-ash/30 bg-ink-2 p-4">
                <h3 className="text-gold font-bold mb-3">四课</h3>
                <SikeCards ks={ks} />
              </div>
              <div className="rounded-xl border border-ash/30 bg-ink-2 p-4">
                <h3 className="text-gold font-bold mb-3">三传</h3>
                <SanchuanChain ks={ks} />
                <div className="mt-4 border-t border-ash/20 pt-3 space-y-1.5 text-sm">
                  {chuan.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="w-12 text-gold">{c.name}</span>
                      <span className="w-8 text-xl text-paper">{c.zhi}</span>
                      <span className="w-20">
                        {c.tianjiang.short}·{c.tianjiang.full}
                      </span>
                      <span className="text-xs text-ash flex-1">
                        {c.tianjiang.zhushi}
                      </span>
                      <span className="text-xs text-paper">六亲 {c.liuqin}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          </>
        ) : (
          <section className="rounded-xl border border-ash/30 bg-ink-2 p-4">
            <h3 className="text-gold font-bold mb-1">课式结果 · {result.algorithmName}</h3>
            <p className="text-xs text-ash mb-3">
              该算法无专属展示视图，以下为原始结果（raw）数据。
            </p>
            <DataTree data={result.raw} />
          </section>
        )
      ) : (
        <section className="rounded-xl border border-ash/30 bg-ink-2 p-6">
          <h3 className="text-gold font-bold mb-1">完整推导过程</h3>
          <p className="text-xs text-ash mb-4">
            一步步还原这课式的诞生过程（{result.algorithmName}）。
          </p>
          <StepRenderer result={result} />
        </section>
      )}

      {result.algorithmId === DALIUREN_ID && <AiDuanke ks={ks} />}

      <footer className="text-center text-xs text-ash pt-4 border-t border-ash/20">
        起课引擎与 liuren-py 同源 · 黄金课例：庚子日 午时 亥将 → 重审课（巳戌卯）
      </footer>
    </main>
  );
}
