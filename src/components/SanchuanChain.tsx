// 三传链：初→中→末，节点含地支/天将/六亲
import type { KeShi } from "@/lib/types";
import { chuanTianjiang } from "@/lib/shike";
import { IconCheck, IconMinus, IconWarning } from "@/components/icons";

const JIXIONG_COLOR: Record<string, string> = {
  吉: "text-jade border-jade/60",
  凶: "text-vermilion border-vermilion/60",
  中: "text-qinghua border-qinghua/60",
};

export default function SanchuanChain({ ks }: { ks: KeShi }) {
  const chuan = chuanTianjiang(ks);
  return (
    <div>
      <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
        {chuan.map((c, i) => (
          <div key={c.name} className="flex items-center gap-2 md:gap-4">
            {i > 0 && <span className="text-ash text-2xl">→</span>}
            <div
              className={`rounded-md border px-4 py-3 text-center min-w-[92px] ${JIXIONG_COLOR[c.tianjiang.jixiong]} bg-ink-2`}
            >
              <div className="text-xs text-ash mb-1">{c.name}</div>
              <div className="font-display text-3xl font-bold text-paper">{c.zhi}</div>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm">
                {c.tianjiang.short}
                <span className="inline-flex">
                  {c.tianjiang.jixiong === "吉" ? (
                    <IconCheck size={13} />
                  ) : c.tianjiang.jixiong === "凶" ? (
                    <IconWarning size={13} />
                  ) : (
                    <IconMinus size={13} />
                  )}
                </span>
              </div>
              <div className="text-xs text-ash mt-0.5">{c.liuqin}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
