# 方向C：AI断课助手（2026-08-06 进度存档）

## 状态：代码全部完成，浏览器实测中途中断，未推送

## 已完成（本次会话）

### 1. `src/lib/prompt.ts`（新）✅
- `buildDivineSystemPrompt()`：断课师傅 system prompt——不自行起课、按课名→三传→天将→六亲→旺衰→旬空逐层断、先总断后分述再建议、400-600字、追问只答追问
- `buildDivinePrompt(ks, question)`：课式→上下文（日柱/占时/月将/课名/贵人/旬空/天地盘/四课/三传带天将六亲/季节旺衰提示）
- 内置参考表：WANGXIU 旺相休囚死、长生十二宫、天将吉凶事象
- `buildDivineMessages()`：组装 system + user messages
- 季节参数：春/夏/秋/冬/四季，`seasonFromNow()` 自动按月份取

### 2. `src/app/api/divine/route.ts`（新）✅
- POST JSON：`{ ks, question, season, history? }`（history 最多保留8轮）
- **key 读取顺序：环境变量 DEEPSEEK_API_KEY → ~/.hermes/.env → config.yaml**
  - ⚠️ 坑：config.yaml 里的 api_key 是**火山引擎 Ark** 的 key（auth.json 可见），不是 deepseek 官方 key，直接用它调 api.deepseek.com 会 401
  - 有效 key 在 `~/.hermes/.env` 的 DEEPSEEK_API_KEY（与 base_url https://api.deepseek.com 配套）
- 调 `https://api.deepseek.com/chat/completions`，model 默认 `deepseek-v4-flash`（可 env 覆盖），stream:true 透传 SSE
- ⚠️ deepseek-v4-flash 是**推理模型**：SSE delta 含 `reasoning_content`（思考）和 `content`（正文）两个字段，正文在思考完成后才出现

### 3. `src/components/AiDuanke.tsx`（新）✅
- 断课对话面板：快捷问题（综合运势/看事业/看感情/看财运）、季节选择、输入框、流式输出、停止按钮、追问历史
- SSE 解析同时累积 reasoning_content（🧠 思考过程，`<details>` 折叠灰字）和 content（正文）
- 课式变化自动清空对话（防跨课串断）
- 追问时把 assistant 的 content 或 reasoning 传给上游

### 4. `src/app/page.tsx` 集成 ✅
- 起课结果下方插入 `<AiDuanke ks={ks} />`

### 5. 验证
- `tsc --noEmit` 通过
- 黄金课例 13/13 vitest 通过
- `next build` 通过（/api/divine 正确识别为动态路由 ƒ）
- **API 实测通过**：curl 黄金课例（庚子日午时亥将→重审课）问"换工作"，返回完整 SSE 流，content 639字：总断→分述（初传巳官鬼空亡/中传戌父母天后/末传卯妻财勾陈）→综合→建议，质量高
- 浏览器实测进行中：页面渲染正常，AI断课面板在课式下方，"看事业"已点击开始流式，🧠思考过程折叠区已出现

## 未完成（下次从这里继续）

1. **浏览器实测收尾**：确认流式完成后正文完整显示、思考过程可折叠、追问一轮、换课清空
2. `next build` 最终确认（AiDuanke 加 reasoning 处理后需重跑）
3. 黄金课例断语自测固化（可选：写个 vitest 调 API 或快照）
4. **推送 GitHub**：`git add -A && git commit && git push origin main`
5. 更新 README 提 AI 断课功能
6. 部署注意：Vercel 需配环境变量 DEEPSEEK_API_KEY（本地读 ~/.hermes/.env，云端读 env）

## 环境注意（沿用上次）

- 断课 prompt 引用断课口诀（手册§8）：skill: chinese-metaphysics references/da-liuren-advanced.md 已加载
- 黄金课例锚点：庚子日午时亥将 → 重审课，三传巳→戌→卯，勾陈/玄武/朱雀，官鬼/父母/妻财，贵人丑·阳贵，旬空辰巳
- 黄金课例 API 测试脚本：`/tmp/divine_test.sh`、`/tmp/sse_full.sh`
