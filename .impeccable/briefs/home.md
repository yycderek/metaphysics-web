# Surface Brief — 首页（唯一页面 /）

## Scope & Mode

单页应用首页（Operate 为主，兼顾 Read：推导过程需可读）。目标：src/app/page.tsx 及其全部组件。

## Audience / Job / Constraints

见 PRODUCT.md。约束：只动视觉，功能与文案不变；亮/暗双主题，默认亮色；不得回退已完成的 a11y 治理。

## Direction contract

THESIS: 一案宣纸——把整个页面做成一张铺开的案头册页：发丝界栏、朱砂印记、楷体书写感，拒绝 SaaS 式卡片堆叠与圆角阴影套路。

OWN-WORLD: 宣纸暖白底（#f7f4ec）上墨黑正文（#26221c），朱砂（#bb352a）为唯一强点缀，青花黛蓝（#31597b）作标题与次级强调；分隔用 1px 发丝线（#ddd5c3），容器是「册页」：平面、细边、小圆角（4-6px）、无投影；暗色为「夜墨」：暖黑底 #15181c、米白墨 #e6e1d5。字体：霞鹜文楷（自托管 woff2，正文/UI）+ 思源宋体 900/600（Noto Serif SC，大标题与课名）。签名元素：竖排小标签（writing-mode: vertical-rl）、朱砂小方印、界栏式双线分隔。

STORY: 访客进入即见一案：顶部细线压边、印章与 title；问事面板居中，右侧术语/历史如案头工具；起课后课式如折子展开，步进推演可细读。

FIRST VIEWPORT: 顶部 hairline 双界栏 + 朱砂印 + 大字标题「玄学 · 占卜」（Noto Serif SC 900）；其下一行说明小字；主区左栏问事（大输入框 + 朱砂主按钮「起卦」），右栏术语速查/历史回看（发丝边册页）；无英雄区、无渐变、无玻璃。

FORM: 用户 pinned 方向「新中式雅致」（三选一定向，concept roll 依规跳过——user-pinned direction beats the roll）。Seed key: pinned-by-user。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Memorable moment

暗色/亮色切换皆是完整世界；课名大字（Noto Serif SC 900）与竖排标签是识别点。

## Unresolved

无。
