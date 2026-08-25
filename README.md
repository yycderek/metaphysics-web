# metaphysics-web · 玄学占卜平台

多算法玄学占卜平台。内置大六壬起课引擎（天地盘、四课、三传、天将六亲可视化 + AI 断课），支持小六壬插件与远程算法服务扩展。深色玄学风（墨底 · 朱砂 · 金），Next.js 16 + Tailwind 4 + framer-motion。

## 功能

- 🔮 **起课工具**（`/`）：选日柱 / 时支 / 月将，一键起课，输出天地盘圆盘、四课、三传链、天将六亲细断
- 📊 **双模式展示**：起课后可切换「课式结果」（天地盘/四课/三传总览）与「🧭 推导过程」（定地盘→安天盘→排四课→九宗门→得三传→布天将 逐步动画，可自动演示）
- 🎓 **六步学习**（`/demo`）：黄金课例全流程动画演示（自动播放）
- 🦉 **AI 断课**（起课结果下方）：基于引擎精确起好的课式，由 AI 流式断课——总断→分述→建议；支持快捷提问（事业/感情/财运）、自由追问、思考过程折叠、课式变化自动清空对话
- 🌓 **主题切换**：亮色（默认）/ 暗色双主题，右上角一键切换，localStorage 持久化
- 📱 响应式：移动端单列，桌面双栏

## 架构（算法可扩展）

- **算法注册表** `src/lib/algorithms/registry.ts`：`AlgorithmAdapter` 接口（`id/name/build/parseInput`），内置大六壬适配器；新算法（小六壬等）实现同一接口即可接入
- **两种插件形态**：
  - 本地插件：`src/plugins/` 写适配器 → `plugins/index.ts` 注册（内置小六壬示例，取消注释即启用）
  - 远程算法服务：页面「🔌 远程算法服务」配置 HTTP 端点即可（任意语言实现，协议见 `docs/PLUGIN-GUIDE.md`，含 Python 示例服务）
- **通用步骤模型** `DivinationResult.steps`：任意算法的推导过程结构化（title/desc/data），推导模式自动渲染；大六壬步骤有专属视图，未知算法回退通用 JSON 树
- **AI Provider 抽象** `src/lib/aiProvider.ts`：OpenAI 兼容协议配置化，见下节

## AI 断课

- **铁律**：前端 TS 引擎先精确起课（KeShi JSON），AI 只负责解读，绝不自行起课——避免市面"AI 算命"起错课的毛病
- 流式 SSE：`/api/divine` 透传 AI 聊天补全，思考过程（`reasoning_content`）与正文（`content`）分开展示
- 断课原则内置：课名 → 三传 → 天将 → 六亲 → 旺衰 → 旬空逐层分析，追问只答追问
- **可替换 AI API**：断课面板 ⚙️ 设置支持任意 OpenAI 兼容服务（DeepSeek/通义/豆包/Kimi/智谱/硅基流动/Ollama/vLLM），配置 baseUrl / apiKey / model / temperature，localStorage 持久化；留空回退服务端默认（环境变量 `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`，旧名 `DEEPSEEK_*` 兼容；本地开发自动读 `~/.hermes/.env`）

## 开发

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # vitest 黄金课例（13 项）
npm run build     # 生产构建
```

## 架构

| 层 | 文件 | 说明 |
|---|---|---|
| 数据 | `src/lib/data.json` | 由 liuren-py `scripts/export_data.py` 导出，勿手改 |
| 算法 | `src/lib/*.ts` | 天地盘 / 四课 / 九宗门 / 天将 / 六亲，与 liuren-py 同源 |
| AI 断课 | `src/lib/prompt.ts` + `src/app/api/divine/route.ts` + `src/components/AiDuanke.tsx` | 断课提示词模板 / deepseek SSE 代理 / 对话面板 |
| 组件 | `src/components/*.tsx` | 天盘圆盘 SVG、四课卡、三传链、表单、步骤演示 |
| 页面 | `src/app/*` | 起课工具页 + 学习演示页 |

## 黄金课例

庚子日 · 午时 · 亥将 → **重审课**，三传 **巳→戌→卯**
（初传勾陈·官鬼 / 中传玄武·父母 / 末传朱雀·妻财），贵人丑·阳贵，旬空辰巳。

## 关联项目

- [liuren-py](https://github.com/yycderek/liuren-py)：起课引擎（Python），本项目的算法来源
