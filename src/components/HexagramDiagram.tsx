"use client";
// 六爻卦象图：自下而上画六爻，阳爻实线、阴爻断线；可标动爻、世应、六亲/六神。
interface Line {
  yang: boolean;
  moving?: boolean;
  tag?: string; // 六亲（如 子孙/官鬼）
  extra?: string; // 六神（如 青龙/白虎）
}
interface Props {
  title: string;
  lines: Line[];
  shiPos?: number; // 1-6
  yingPos?: number; // 1-6
  movingColor?: boolean;
}

export default function HexagramDiagram({ title, lines, shiPos, yingPos }: Props) {
  return (
    <div className="rounded-lg border border-ash/30 bg-ink-2 p-3">
      <div className="text-center text-sm text-gold font-bold mb-2">{title}</div>
      <div className="flex flex-col-reverse gap-1">
        {lines.map((l, i) => {
          const pos = i + 1;
          const isGui = pos === shiPos;
          const isYing = pos === yingPos;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-3 text-[10px] text-ash">{pos}</span>
              <span className={`w-8 text-[10px] ${l.moving ? "text-vermilion" : "text-ash"}`}>
                {l.moving ? "动" : l.tag ? "" : ""}
              </span>
              <div className="flex-1 flex items-center gap-1">
                {l.yang ? (
                  <div
                    className={`h-2 flex-1 rounded-sm ${l.moving ? "bg-vermilion" : "bg-paper/80"}`}
                  />
                ) : (
                  <>
                    <div
                      className={`h-2 flex-[0.42] rounded-sm ${l.moving ? "bg-vermilion" : "bg-paper/80"}`}
                    />
                    <div className="flex-1" />
                    <div
                      className={`h-2 flex-[0.42] rounded-sm ${l.moving ? "bg-vermilion" : "bg-paper/80"}`}
                    />
                  </>
                )}
              </div>
              <span className={`w-12 text-xs ${isGui ? "text-gold font-bold" : "text-ash"}`}>
                {isGui ? "世" : isYing ? "应" : (l.extra ?? "")}
              </span>
              <span className="w-14 text-xs text-paper/80">{l.tag ?? ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
