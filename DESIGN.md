---
name: 玄学 · 占卜
description: 新中式雅致的占卜工作台——宣纸、墨色、朱砂印、发丝界栏
colors:
  paper-ground: "#f6f2e8"
  album-surface: "#fcfaf3"
  ink-text: "#2b251b"
  vermilion-seal: "#b4362a"
  qinghua-blue: "#30587d"
  jade-green: "#247a5f"
  paper-ash: "#6e6350"
  seal-ink: "#faf5ea"
  night-ground: "#15181b"
  night-surface: "#1d2126"
  night-text: "#e7e1d2"
  night-vermilion: "#cf5040"
  night-qinghua: "#a3bdd0"
typography:
  display:
    fontFamily: "'Noto Serif SC', 'LXGW WenKai', 'Songti SC', 'SimSun', serif"
    fontWeight: 900
    letterSpacing: "0.15em"
    lineHeight: 1.3
  body:
    fontFamily: "'LXGW WenKai', 'Kaiti SC', 'STKaiti', 'KaiTi', 'Songti SC', serif"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "'Noto Serif SC', serif"
    fontWeight: 700
    letterSpacing: "0.2em"
rounded:
  sm: "4px"
  md: "6px"
spacing:
  card-padding: "20px"
  section-gap: "20px"
components:
  button-primary:
    backgroundColor: "{colors.vermilion-seal}"
    textColor: "{colors.seal-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.vermilion-seal}"
  card-album:
    backgroundColor: "{colors.album-surface}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.md}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.album-surface}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.md}"
---

# Design System: 玄学 · 占卜

## Overview

**Creative North Star: "一案宣纸"**

整个界面是一张铺开的案头册页：暖白宣纸为底，墨色行文，朱砂只落在印记与主动作上，青花黛蓝承担标题与指引。容器是平面的「册页」——发丝边框、小圆角、零投影，层次靠底色微差（页面纸 vs 册页纸）与界栏双线，不靠阴影。暗色是同一世界的夜晚形态「夜墨」：暖黑案面、米白墨字，朱砂在暗处提亮。

**Key Characteristics:**

- 亮/暗双主题同等完成度，默认亮色，`.dark` 类驱动
- 平面册页容器（1px 发丝边 + 6px 圆角），全站无投影
- 签名元素：朱砂方印（Seal）、界栏双线（`.double-rule`）、竖排侧签（`.vertical-rl`）
- 自托管中文字体：霞鹜文楷正文 + 思源宋体标题

## Colors

宣纸暖色系为主场，朱砂是唯一强点缀。

### Primary

- **朱砂 Vermilion Seal**（`--vermilion`）：主按钮实底、印章、关键标记（克课、动爻、当前步骤描边）。一屏之内强朱砂不超过两处。

### Secondary

- **青花黛蓝 Qinghua Blue**（`--gold`，历史变量名保留）：标题、链接态、选中态、术语下划线。

### Tertiary

- **青玉 Jade**（`--jade`）：成功/确认反馈（LiveNote 提示、应验标记）。

### Neutral

- **宣纸 Paper Ground**（`--ink`）：页面底。
- **册页 Album Surface**（`--ink-2`）：容器底，比页面更白一分，借微差浮起。
- **墨色 Ink Text**（`--paper`）：正文与标题主色。
- **纸灰 Paper Ash**（`--ash`）：次级文字与发丝线；对宣纸底对比度 ≥4.5:1，不得再淡。
- **印上白文 Seal Ink**（`--seal-ink`）：朱砂实底上的文字色，恒定暖白，不随主题翻转。

暗色映射：夜墨底 / 案面 / 米白墨 / 提亮朱砂 / 月白青，见 frontmatter `night-*`。

### Named Rules

**The One-Seal Rule.** 朱砂实底只给主动作（起课/起卦/断课）与印章；其余强调一律青花描边或文字色，不做色块填充。

## Typography

**Display Font:** Noto Serif SC 900/600（思源宋体，自托管，`font-display`）
**Body Font:** LXGW WenKai（霞鹜文楷，自托管，`font-serif-cn`，全局默认）

**Character:** 宋体的碑刻感撑住题名与干支大字，文楷的手写体温负责正文与界面——一个立骨，一个行文。

### Hierarchy

- **Display**（900, text-2xl~4xl, tracking 0.15–0.3em）：站点题名、课名（如「重审课」）。
- **Title**（700, text-sm~base, tracking 0.2em）：面板标题、区块题头，青花色。
- **Vertical Label**（700, text-sm, `.vertical-rl` 竖排 + 0.35em 字距）：册页侧缘签名，如 天地盘/四课/三传。
- **Body**（400, text-sm~base, line-height 1.8）：断语、说明、表单。
- **Label**（text-xs, text-ash）：数据标签、免责声明。

### Named Rules

**The No-Clone Rule.** 中文标题必带正字距（0.1em 以上）；西文/数字混排不单独换字体。字重对比要大（400 vs 900），不用 500/600 糊中间层。

## Layout

单页工作台：居中栏（max-w-6xl）内 `lg:` 双栏——主区（问事/起课/结果）+ 300px 侧栏（术语/历史/备份）；移动端折叠为 tab 切换。节奏：卡片内边距 20px（p-5），卡片间距 20px（space-y-5 / gap-5），题头上下以界栏双线收边。

## Elevation & Depth

全站无投影。深度靠三层纸色（页面纸 → 册页 → 内嵌纸）与发丝边框表达；主题切换时底色 0.25s 过渡。选中文字染朱砂 22%、输入光标朱砂、滚动条纸灰——浏览器表面同样入设计。

### Named Rules

**The Flat-Album Rule.** 任何容器不得加 `shadow-*`；需要层次时换底色或加发丝线，不许加阴影。

## Shapes

小圆角一统：容器与按钮 6px（rounded-md），焦点环 4px。禁用大圆角卡片（rounded-xl+）与药丸形大容器；药丸仅留给示例 chip 等小控件。印章为近方形（rx 6）。边框一律 1px 发丝（ash 25–40% 透明度），分隔用 hairline 或界栏双线。

## Components

### Buttons

- **Shape:** 6px 圆角。
- **Primary:** 朱砂实底 + 印白文字（`bg-vermilion text-seal-ink`），hover 降 90% 不透明度；busy 态带「…」文案。
- **Secondary/Ghost:** 纸灰发丝描边（`border-ash/30~40`），hover 描边转青花、文字转墨色。
- **Focus:** 全部保留 `focus-visible:ring-2 ring-gold` 或全局 :focus-visible 描边。

### Cards / Containers

- 册页卡：`rounded-md border border-ash/25 bg-ink-2 p-5`；内嵌区块用 `bg-ink` 形成纸色微差。
- 列表行用 `divide-y divide-ash/15` 发丝分隔，不用卡片套卡片。

### Inputs / Fields

- `rounded-md border-ash/30 bg-ink-2`，focus 出青花 ring；标签必须 `<label htmlFor>` 关联，占位符仅作示例。

### Navigation

- 顶部题头：朱砂印 + 宋体题名 + 界栏双线；无导航栏。模式切换（课式结果/推导过程）为描边小签，选中态青花描边 + 淡青花底。

### Signature: Seal 印章

朱砂双线方印（外框 rx 6 / 内框 rx 6），盖印动效 `seal-stamp`（0.45s 回弹），`role="img"` + aria-label。

### Signature: Vertical Label 竖排侧签

`.vertical-rl`（writing-mode: vertical-rl + 0.35em 字距），置于册页左缘，青花宋体小字。

## Do's and Don'ts

### Do:

- **Do** 用三层纸色做层次，留白要大方（p-5 / space-y-5 起步）。
- **Do** 让朱砂保持稀有；一屏强朱砂 ≤2 处。
- **Do** 亮/暗双主题成对调整 token，暗色同步提亮而非反色。
- **Do** 保持 a11y 基线：label 关联、focus-visible、aria-live、reduced-motion 降级。

### Don't:

- **Don't** 加投影、渐变、玻璃模糊——平面册页不靠这些。
- **Don't** 用彩色粗侧边条（border-l-2+）标记卡片。
- **Don't** 用 rounded-xl 以上大圆角容器。
- **Don't** 把纸灰（--ash）再调淡，次级文字对比度不得回退到 4.5:1 以下。
