# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

中文用户，三类场景兼顾（用户确认）：个人随手起课占问，追求操作顺畅、结果清晰；大六壬/六爻/梅花爱好者，看重推导过程的可读性与学习价值；向他人演示分享，第一印象与精致度重要。

## Product Purpose

多算法玄学占卜平台：描述问题即可由 AI 择法起课并断卦；也可手动指定参数精确起课，查看天地盘、四课、三传、天将、六亲的可视化与步进式推导过程。成功 = 用户顺畅完成一次起课并读懂结果。

## Positioning

内置真实起课引擎（程序精确排盘，非 AI 编造），AI 只负责解读；推导过程逐步可视化；算法以插件机制可扩展。

## Operating Context

单页 Web 应用，桌面与移动浏览器均可使用；历史记录、应验标记、API 配置存于 localStorage，支持导出/导入 JSON 备份；AI 功能需用户自备兼容 OpenAI 的 API key。

## Capabilities and Constraints

- 算法：大六壬、小六壬、六爻、梅花易数（插件注册机制）。
- AI：SSE 流式断课（/api/agent）、按课盘解读（AiDuanke）、评测面板（/api/eval）。
- 技术栈：Next.js 16（App Router）+ React 19 + Tailwind CSS v4（CSS-first）+ framer-motion 12；测试用 vitest。
- 主题：亮/暗双主题，默认亮色，localStorage 持久化，内联脚本防闪烁。
- 本轮重设计边界（用户确认）：只动视觉——布局、配色、字体、间距、质感可全部重做；功能逻辑与文案保持不变。

## Brand Commitments

- 名称「玄学 · 占卜」。
- 视觉方向：用户指定「新中式雅致」，整体重做。
- 字体：用户选择自托管中文 Web 字体（如霞鹜文楷/思源宋体）。
- 用户明确反感（须避开）：太像通用 SaaS 模板；太素没有提升；可读性差。

## Evidence on Hand

真实算法引擎位于 `src/lib/algorithms/`（大六壬/六爻/梅花）与 `src/plugins/`。无 testimonials、无商业声明；UI 中不得编造此类内容。

## Product Principles

1. 功能与文案稳定，视觉可以大胆。
2. 可读性优先于装饰；装饰服务于阅读节奏。
3. 中式审美落在材质与排版上（纸、墨、印、楷），不做符号堆砌。
4. 亮/暗双主题同等完成度。

## Accessibility & Inclusion

遵循 Vercel Web Interface Guidelines；2026-09 已完成一轮 a11y 治理（label 关联、focus-visible 焦点环、aria-live 播报、reduced-motion 降级），重设计不得回退这些特性。
