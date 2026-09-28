// 站点题头：朱砂印 + 碑额式题名 + 界栏双线，如册页卷首。
import Seal from "@/components/Seal";

interface Props {
  title: string;
  subtitle?: string;
}

export default function SiteHeader({ title, subtitle }: Props) {
  return (
    <header className="double-rule flex flex-col items-center gap-3 pb-6 pt-2 text-center">
      <Seal char="玄" size={44} />
      <h1 className="font-display text-3xl font-black tracking-[0.3em] text-paper md:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="text-sm tracking-wider text-ash">{subtitle}</p>}
    </header>
  );
}
