// 四课卡：生克关系高亮，克处标星
import type { KeShi } from "@/lib/types";
import { sikeEntries } from "@/lib/shike";

export default function SikeCards({ ks }: { ks: KeShi }) {
  const entries = sikeEntries(ks);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {entries.map((e) => {
        const isKe = e.isKe;
        return (
          <div
            key={e.index}
            className={`rounded-md p-4 text-center border transition-colors ${
              isKe ? "border-vermilion/60 bg-vermilion/5" : "border-ash/25 bg-ink-2"
            }`}
          >
            <div className="text-xs text-ash mb-1">
              第{e.index}课 {isKe && <span className="text-vermilion" aria-hidden="true">★</span>}
            </div>
            <div className="font-display text-xl font-bold text-paper my-1.5">
              {e.bottom} <span className="font-serif-cn font-normal text-ash">→</span> {e.top}
            </div>
            <div className={`text-xs ${isKe ? "text-vermilion" : "text-ash"}`}>{e.relation}</div>
          </div>
        );
      })}
    </div>
  );
}
