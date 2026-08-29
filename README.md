# metaphysics-web · 玄学占卜平台

多算法玄学占卜平台。内置大六壬起课引擎（天地盘、四课、三传、天将六亲可视化 + AI 断课），支持小六壬插件与远程算法服务扩展。深色玄学风（墨底 · 朱砂 · 金），Next.js 16 + Tailwind 4 + framer-motion。

## 功能

- 🔮 **起课工具**（`/`）：选日柱 / 时支 / 月将，一键起课，输出天地盘圆盘、四课、三传链、天将六亲细断
- 📊 **双模式展示**：起课后可切换「课式结果」（天地盘/四课/三传总览）与「🧭 推导过程」（定地盘→安天盘→排四课→九宗门→得三传→布天将 逐步动画，可自动演示）
- 🎓 **六步学习**（`/demo`）：黄金课例全流程动画演示（自动播放）
- 🧬 **智能占卜 Agent**（自主式）：直接描述问事（可带日期/时辰），Agent 自主选择算法与参数、调用引擎精确起课，再输出**结构化断语**（卦象/简略与详细/依据）；支持澄清追问、复读已算之卦、换参数对比、SSE 流式过程；预留**可选出生信息**用于个人化断课
- 📤 **分享卡**：每卦可一键生成玄学风竖版图片（下载 PNG / 复制图片）
- 🦉 **AI 断课**（起课结果下方）：基于引擎精确起好的课式，由 AI 流式断课——总断→分述→建议；支持快捷提问（事业/感情/财运）、自由追问、思考过程折叠、课式变化自动清空对话
- 🌓 **主题切换**：亮色（默认）/ 暗色双主题，右上角一键切换，localStorage 持久化
- 📱 响应式：移动端单列，桌面双栏

## 架构（算法可扩展）

- **算法注册表** `src/lib/algorithms/registry.ts`：`AlgorithmAdapter` 接口（`id/name/build/parseInput`）。当前内置 **大六壬、小六壬、六爻、梅花易数**（小六壬为本地插件，六爻/梅花在 `algorithms/liuyao.ts`、`algorithms/meihua.ts`）；新算法实现同一接口即可接入
- **两种插件形态**：
  - 本地插件：`src/plugins/` 写适配器 → `plugins/index.ts` 注册
  - 远程算法服务：页面「🔌 远程算法服务」配置 HTTP 端点即可（任意语言实现，协议见 `docs/PLUGIN-GUIDE.md`，含 Python 示例服务）
- **易学公库** `src/lib/algorithms/yijing.ts`：六十四卦（上下卦→卦名）、八宫世应、纳甲、先天八卦数，六爻/梅花复用
- **断课模板** `src/lib/divine/`：每种算法一个模板产生"课式上下文"——大六壬/小六壬/六爻/梅花/通用；六爻/梅花均含专业断法（用神/体用/本互变/动爻）
- **专属可视化**：六爻排盘（本卦/变卦卦象 + 纳甲六亲六神表 + 世应旬空）、梅花卦象（本/互/变卦）
- **通用步骤模型** `DivinationResult.steps`：任意算法的推导过程结构化（title/desc/data），推导模式自动渲染；大六壬步骤有专属视图，未知算法回退通用 JSON 树
- **AI Provider 抽象** `src/lib/aiProvider.ts`：OpenAI 兼容协议配置化，见下节

## AI 断课

- **铁律**：前端 TS 引擎先精确起课（KeShi JSON），AI 只负责解读，绝不自行起课——避免市面"AI 算命"起错课的毛病
- **智能 Agent**（`/api/agent` + `src/lib/agent/`）：模型通过 `divinate` 工具调用引擎（function-calling），自主决定算法/参数；信息不足会先 `ask_clarification` 澄清；已算过的卦作为记忆可复读对比；最终输出结构化断语并**自校验**（大六壬比对三传/天将/六亲、其它算法比对卦名，不符重试）；**SSE 流式**返回过程；默认取**真太阳时 + 节气精确月将**（可选经度，见 `lib/astro.ts`）；同参数 divinate 去重
- 流式 SSE：`/api/divine` 透传 AI 聊天补全，思考过程（`reasoning_content`）与正文（`content`）分开展示
- 断课原则内置：课名 → 三传 → 天将 → 六亲 → 旺衰 → 旬空逐层分析，追问只答追问
- **可替换 AI API**：断课面板 ⚙️ 设置支持任意 OpenAI 兼容服务（DeepSeek/通义/豆包/Kimi/智谱/硅基流动/Ollama/vLLM），配置 baseUrl / apiKey / model / temperature，localStorage 持久化；留空回退服务端默认（环境变量 `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`，旧名 `DEEPSEEK_*` 兼容；本地开发自动读 `~/.hermes/.env`）

## 开发

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # vitest 单元/组件测试（95 项，含易学/六爻/梅花/天文/断课模板/Agent/SSE）
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint（eslint-config-next）
npm run format       # Prettier 格式化
npm run build        # 生产构建
```

质量门禁（CI）：`tsc --noEmit` + `eslint .` + `prettier --check .` + `vitest run` + `next build` 全部通过才合入。

## 架构

| 层      | 文件                                                                                | 说明                                                    |
| ------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 数据    | `src/lib/data.json`                                                                 | 由 liuren-py `scripts/export_data.py` 导出，勿手改      |
| 算法    | `src/lib/*.ts`                                                                      | 天地盘 / 四课 / 九宗门 / 天将 / 六亲，与 liuren-py 同源 |
| AI 断课 | `src/lib/prompt.ts` + `src/app/api/divine/route.ts` + `src/components/AiDuanke.tsx` | 断课提示词模板 / deepseek SSE 代理 / 对话面板           |
| 组件    | `src/components/*.tsx`                                                              | 天盘圆盘 SVG、四课卡、三传链、表单、步骤演示            |
| 页面    | `src/app/*`                                                                         | 起课工具页 + 学习演示页                                 |

## 黄金课例

庚子日 · 午时 · 亥将 → **重审课**，三传 **巳→戌→卯**
（初传勾陈·官鬼 / 中传玄武·父母 / 末传朱雀·妻财），贵人丑·阳贵，旬空辰巳。

## 关联项目

- [liuren-py](https://github.com/yycderek/liuren-py)：起课引擎（Python），本项目的算法来源
