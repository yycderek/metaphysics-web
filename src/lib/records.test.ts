// 应验追踪与历史（纯函数）测试
import { describe, it, expect } from "vitest";
import { changyanStats, upsertChangyan, reliability, type ChangyanEntry } from "./changyan";
import { pushHistoryEntry, removeHistoryEntry, type HistoryEntry } from "./history";

const e = (over: Partial<ChangyanEntry> = {}): ChangyanEntry => ({
  id: "1",
  algorithmId: "daliuren",
  卦象: "重审课",
  总结: "x",
  outcome: "应验",
  ts: 1,
  ...over,
});

describe("应验追踪", () => {
  it("upsert 去重追加，按 id 更新", () => {
    const list = upsertChangyan(
      [e({ id: "a", outcome: "应验" })],
      e({ id: "a", outcome: "未应验" }),
    );
    expect(list).toHaveLength(1);
    expect(list[0].outcome).toBe("未应验");
    const list2 = upsertChangyan(list, e({ id: "b" }));
    expect(list2).toHaveLength(2);
  });

  it("accuracy = 应验 / 已验证", () => {
    const list = [
      e({ id: "1", outcome: "应验", algorithmId: "daliuren" }),
      e({ id: "2", outcome: "应验", algorithmId: "daliuren" }),
      e({ id: "3", outcome: "未应验", algorithmId: "daliuren" }),
      e({ id: "4", outcome: "待验证", algorithmId: "meihua" }),
    ];
    const s = changyanStats(list);
    expect(s.total).toBe(4);
    expect(s.verified).toBe(3);
    expect(s.acc).toBe(Math.round((2 / 3) * 100));
    expect(s.byAlgo.daliuren.acc).toBe(Math.round((2 / 3) * 100));
    expect(s.byAlgo.meihua.acc).toBeNull(); // 无已验证
  });

  it("按事类分组统计 + 可靠性分级", () => {
    const list = [
      e({ id: "1", outcome: "应验", topic: "事业" }),
      e({ id: "2", outcome: "应验", topic: "事业" }),
      e({ id: "3", outcome: "未应验", topic: "事业" }),
      e({ id: "4", outcome: "应验", topic: "感情" }),
      e({ id: "5", outcome: "应验", topic: "感情" }),
    ];
    const s = changyanStats(list);
    expect(s.byTopic["事业"].acc).toBe(Math.round((2 / 3) * 100));
    expect(s.byTopic["感情"].acc).toBe(100);
    expect(reliability(80).label).toBe("可靠");
    expect(reliability(55).label).toBe("中等");
    expect(reliability(40).label).toBe("谨慎");
    expect(reliability(null).label).toBe("样本不足");
  });
});

describe("历史回看", () => {
  const h = (id: string): HistoryEntry => ({
    id,
    question: "问" + id,
    卦象: "卦" + id,
    interpretation: {
      卦象: "a",
      算法: "b",
      结论: { 总断: "t", 现状: "x", 建议: "y" },
      逐步: [],
      置信度: "中",
    },
    ts: 1,
  });

  it("push 去重且最多 20 条", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < 25; i++) list = pushHistoryEntry(list, h(String(i)));
    expect(list).toHaveLength(20);
    expect(list[0].id).toBe("24"); // 最新在前
  });

  it("remove 按 id 删除", () => {
    const list = pushHistoryEntry(pushHistoryEntry([], h("a")), h("b"));
    const after = removeHistoryEntry(list, "a");
    expect(after.map((x) => x.id)).toEqual(["b"]);
  });
});
